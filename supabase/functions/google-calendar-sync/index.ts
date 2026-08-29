import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// Google Calendar color IDs for tasks (distinct from normal events)
// 1=blue, 2=green, 3=purple, 4=red, 5=yellow, 6=orange, 7=teal, 8=gray, 9=blue-green, 10=blueberry
const TASK_COLOR_ID = "9"; // blue-green — visually distinct from event colors

interface TokenRow {
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  google_email: string | null;
}

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  return await res.json();
}

async function getValidToken(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ accessToken: string; tokenRow: TokenRow }> {
  const { data, error } = await supabase
    .from("google_calendar_tokens")
    .select("access_token, refresh_token, token_expires_at, google_email")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`DB error: ${error.message}`);
  if (!data) throw new Error("Google Calendar not connected");

  const tokenRow = data as TokenRow;
  const expiresAt = new Date(tokenRow.token_expires_at);
  const now = new Date();

  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const refreshed = await refreshAccessToken(
      tokenRow.refresh_token,
      clientId,
      clientSecret
    );

    const newExpiresAt = new Date(
      Date.now() + refreshed.expires_in * 1000
    ).toISOString();

    await supabase
      .from("google_calendar_tokens")
      .update({
        access_token: refreshed.access_token,
        token_expires_at: newExpiresAt,
      })
      .eq("user_id", userId);

    return { accessToken: refreshed.access_token, tokenRow };
  }

  return { accessToken: tokenRow.access_token, tokenRow };
}

async function googleCalendarFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${GOOGLE_CALENDAR_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

// ===== Sync: import events from Google Calendar =====
async function importFromGoogle(
  supabase: ReturnType<typeof createClient>,
  accessToken: string,
  userId: string,
  timeMin: string,
  timeMax: string
) {
  const res = await googleCalendarFetch(
    accessToken,
    `/calendars/primary/events?singleEvents=true&timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=250`
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error: ${err}`);
  }

  const { items } = await res.json();
  let imported = 0;

  for (const item of items ?? []) {
    // Skip events that are not "confirmed" (e.g. cancelled)
    if (item.status !== "confirmed") continue;

    // Check if already imported
    const { data: existing } = await supabase
      .from("calendar_events")
      .select("id")
      .eq("google_event_id", item.id)
      .maybeSingle();

    if (existing) continue;

    // Determine event type from Google colorId or default
    let type = "work";
    if (item.colorId === "1") type = "meeting";
    else if (item.colorId === "2") type = "personal";
    else if (item.colorId === "4") type = "break";
    else if (item.colorId === "9") type = "study";

    const eventData = {
      user_id: userId,
      title: item.summary || "（無題）",
      start_time: item.start.dateTime || item.start.date,
      end_time: item.end.dateTime || item.end.date,
      type,
      location: item.location ?? null,
      is_fixed: true,
      google_event_id: item.id,
    };

    const { error } = await supabase.from("calendar_events").insert(eventData);
    if (!error) imported++;
  }

  return { imported };
}

// ===== Sync: export events to Google Calendar =====
async function exportEventToGoogle(
  accessToken: string,
  event: {
    title: string;
    start_time: string;
    end_time: string;
    location: string | null;
  }
): Promise<string> {
  const body = {
    summary: event.title,
    start: { dateTime: event.start_time },
    end: { dateTime: event.end_time },
    location: event.location ?? undefined,
  };

  const res = await googleCalendarFetch(accessToken, "/calendars/primary/events", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to export event: ${err}`);
  }

  const data = await res.json();
  return data.id;
}

// ===== Export task to Google Calendar with distinct color =====
async function exportTaskToGoogle(
  accessToken: string,
  task: {
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
  }
): Promise<string> {
  const body = {
    summary: `[タスク] ${task.title}`,
    description: task.description ?? undefined,
    start: { dateTime: task.start_time },
    end: { dateTime: task.end_time },
    colorId: TASK_COLOR_ID,
  };

  const res = await googleCalendarFetch(accessToken, "/calendars/primary/events", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to export task: ${err}`);
  }

  const data = await res.json();
  return data.id;
}

// ===== Delete event from Google Calendar =====
async function deleteFromGoogle(
  accessToken: string,
  googleEventId: string
): Promise<void> {
  const res = await googleCalendarFetch(
    accessToken,
    `/calendars/primary/events/${googleEventId}`,
    { method: "DELETE" }
  );

  // 404 is OK — event already deleted
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Failed to delete event: ${err}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's JWT to identify the user
    const userSupabase = createClient(supabaseUrl, authHeader.replace("Bearer ", ""), {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a service-role client for DB operations
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    const { action } = await req.json();

    switch (action) {
      case "sync": {
        // Import events from Google Calendar for the next 30 days
        const { accessToken } = await getValidToken(adminSupabase, user.id);
        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);

        const result = await importFromGoogle(
          adminSupabase,
          accessToken,
          user.id,
          now.toISOString(),
          thirtyDaysLater.toISOString()
        );

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "export-event": {
        const { eventId } = await req.json();
        const { accessToken } = await getValidToken(adminSupabase, user.id);

        // Fetch the event from DB
        const { data: event, error: dbErr } = await adminSupabase
          .from("calendar_events")
          .select("*")
          .eq("id", eventId)
          .maybeSingle();

        if (dbErr || !event) {
          return new Response(
            JSON.stringify({ error: "Event not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If already has google_event_id, update instead of create
        if (event.google_event_id) {
          // Delete old, create new (simpler than PATCH)
          await deleteFromGoogle(accessToken, event.google_event_id);
        }

        const googleEventId = await exportEventToGoogle(accessToken, {
          title: event.title,
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
        });

        // Save google_event_id back to DB
        await adminSupabase
          .from("calendar_events")
          .update({ google_event_id: googleEventId })
          .eq("id", eventId);

        return new Response(
          JSON.stringify({ google_event_id: googleEventId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "export-task": {
        const { taskId, startTime, endTime } = await req.json();
        const { accessToken } = await getValidToken(adminSupabase, user.id);

        // Fetch the task from DB
        const { data: task, error: dbErr } = await adminSupabase
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .maybeSingle();

        if (dbErr || !task) {
          return new Response(
            JSON.stringify({ error: "Task not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If already has google_event_id, delete old one
        if (task.google_event_id) {
          await deleteFromGoogle(accessToken, task.google_event_id);
        }

        const googleEventId = await exportTaskToGoogle(accessToken, {
          title: task.title,
          description: task.description,
          start_time: startTime,
          end_time: endTime,
        });

        // Save google_event_id back to DB
        await adminSupabase
          .from("tasks")
          .update({ google_event_id: googleEventId, google_color_id: TASK_COLOR_ID })
          .eq("id", taskId);

        return new Response(
          JSON.stringify({ google_event_id: googleEventId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete-from-google": {
        const { googleEventId } = await req.json();
        const { accessToken } = await getValidToken(adminSupabase, user.id);

        await deleteFromGoogle(accessToken, googleEventId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        // Check if Google Calendar is connected
        const { data: tokenData } = await adminSupabase
          .from("google_calendar_tokens")
          .select("google_email, token_expires_at")
          .eq("user_id", user.id)
          .maybeSingle();

        return new Response(
          JSON.stringify({
            connected: !!tokenData,
            email: tokenData?.google_email ?? null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disconnect": {
        const { error: delErr } = await adminSupabase
          .from("google_calendar_tokens")
          .delete()
          .eq("user_id", user.id);

        if (delErr) throw delErr;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "store-tokens": {
        // Store OAuth tokens after user completes Google OAuth flow
        const { accessToken: at, refreshToken: rt, expiresIn } = await req.json();

        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        // Get user's Google email
        const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
          headers: { Authorization: `Bearer ${at}` },
        });
        let googleEmail: string | null = null;
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          googleEmail = userInfo.email ?? null;
        }

        // Upsert tokens (one row per user)
        const { data: existing } = await adminSupabase
          .from("google_calendar_tokens")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          await adminSupabase
            .from("google_calendar_tokens")
            .update({
              access_token: at,
              refresh_token: rt,
              token_expires_at: expiresAt,
              google_email: googleEmail,
            })
            .eq("user_id", user.id);
        } else {
          await adminSupabase.from("google_calendar_tokens").insert({
            user_id: user.id,
            access_token: at,
            refresh_token: rt,
            token_expires_at: expiresAt,
            google_email: googleEmail,
          });
        }

        return new Response(
          JSON.stringify({ success: true, email: googleEmail }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
