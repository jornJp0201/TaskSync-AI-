import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AuthUser {
  id: string;
  token: string;
}

async function getUser(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, token };
}

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function handleStatus(userId: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("github_tokens")
    .select("github_username")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    connected: !!data,
    username: data?.github_username ?? null,
  };
}

async function handleCallback(userId: string, code: string) {
  const clientId = Deno.env.get("GITHUB_CLIENT_ID");
  const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return { error: "GitHub OAuth credentials not configured" };
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    return { error: tokenData.error_description || tokenData.error };
  }

  const accessToken = tokenData.access_token;
  const scope = tokenData.scope;

  // Fetch user profile
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  const userData = await userRes.json();
  const username = userData.login;

  const supabase = getServiceClient();

  // Upsert token
  await supabase
    .from("github_tokens")
    .upsert(
      {
        user_id: userId,
        access_token: accessToken,
        scope,
        github_username: username,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return { username };
}

async function handleDisconnect(userId: string) {
  const supabase = getServiceClient();
  await supabase.from("github_tokens").delete().eq("user_id", userId);
  await supabase.from("github_repos").delete().eq("user_id", userId);
  await supabase.from("github_issues").delete().eq("user_id", userId);
  return { success: true };
}

async function handleSyncIssues(userId: string) {
  const supabase = getServiceClient();

  const { data: tokenData } = await supabase
    .from("github_tokens")
    .select("access_token, github_username")
    .eq("user_id", userId)
    .maybeSingle();

  if (!tokenData) {
    return { error: "GitHub not connected" };
  }

  const accessToken = tokenData.access_token;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
  };

  // Fetch assigned issues across all repos
  const issuesRes = await fetch(
    "https://api.github.com/issues?filter=assigned&state=open&per_page=100",
    { headers }
  );
  const issues = await issuesRes.json();

  if (!Array.isArray(issues)) {
    return { error: "Failed to fetch issues from GitHub" };
  }

  let imported = 0;
  const rowsToUpsert = issues.map((issue: any) => ({
    user_id: userId,
    github_id: issue.id,
    repo_full_name: issue.repository_url?.replace("https://api.github.com/repos/", "") || "",
    number: issue.number,
    title: issue.title,
    body: issue.body?.slice(0, 2000) ?? null,
    state: issue.state,
    is_pr: !!issue.pull_request,
    labels: (issue.labels || []).map((l: any) => l.name),
    assignee_login: issue.assignee?.login ?? null,
    html_url: issue.html_url,
    created_at_github: issue.created_at,
    updated_at_github: issue.updated_at,
    fetched_at: new Date().toISOString(),
  }));

  if (rowsToUpsert.length > 0) {
    const { error } = await supabase
      .from("github_issues")
      .upsert(rowsToUpsert, { onConflict: "user_id,github_id" });
    if (error) {
      return { error: error.message };
    }
    imported = rowsToUpsert.length;
  }

  return { imported };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/github-sync", "");

    const user = await getUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: unknown;

    if (path === "/status") {
      result = await handleStatus(user.id);
    } else if (path === "/callback") {
      const body = await req.json();
      result = await handleCallback(user.id, body.code);
    } else if (path === "/disconnect") {
      result = await handleDisconnect(user.id);
    } else if (path === "/sync-issues") {
      result = await handleSyncIssues(user.id);
    } else {
      result = { error: "Unknown path" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
