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

interface TaskInput {
  id: string;
  title: string;
  priority: string;
  estimated_minutes: number;
  due_date: string | null;
  status: string;
}

interface EventInput {
  start_time: string;
  end_time: string;
  title: string;
}

interface ScheduleSuggestion {
  task_id: string;
  task_title: string;
  suggested_start: string;
  suggested_end: string;
  reason: string;
  confidence: number;
}

interface Gap {
  start: string;
  end: string;
  duration_minutes: number;
}

interface ScheduleResult {
  suggestions: ScheduleSuggestion[];
  gaps: Gap[];
  summary: string;
}

function calculateGaps(
  events: EventInput[],
  dateStr: string,
  workStart = 9,
  workEnd = 21
): Gap[] {
  const sorted = [...events].sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );

  const gaps: Gap[] = [];
  let cursor = new Date(`${dateStr}T${String(workStart).padStart(2, "0")}:00:00`);

  for (const ev of sorted) {
    const evStart = new Date(ev.start_time);
    const evEnd = new Date(ev.end_time);
    if (evStart > cursor) {
      const duration = (evStart.getTime() - cursor.getTime()) / 60000;
      if (duration >= 15) {
        gaps.push({
          start: cursor.toISOString(),
          end: evStart.toISOString(),
          duration_minutes: Math.round(duration),
        });
      }
    }
    if (evEnd > cursor) cursor = evEnd;
  }

  const endOfDay = new Date(`${dateStr}T${String(workEnd).padStart(2, "0")}:00:00`);
  if (cursor < endOfDay) {
    const duration = (endOfDay.getTime() - cursor.getTime()) / 60000;
    if (duration >= 15) {
      gaps.push({
        start: cursor.toISOString(),
        end: endOfDay.toISOString(),
        duration_minutes: Math.round(duration),
      });
    }
  }

  return gaps;
}

function scheduleTasksInGaps(
  tasks: TaskInput[],
  gaps: Gap[]
): ScheduleSuggestion[] {
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const sortedTasks = [...tasks]
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

  const suggestions: ScheduleSuggestion[] = [];
  const availableGaps = [...gaps];

  for (const task of sortedTasks) {
    const chunkMinutes = Math.min(task.estimated_minutes, 120);
    let remaining = task.estimated_minutes;

    for (const gap of availableGaps) {
      if (remaining <= 0) break;
      if (gap.duration_minutes < 15) continue;

      const slotMinutes = Math.min(remaining, gap.duration_minutes, chunkMinutes);
      if (slotMinutes < 15) continue;

      const startTime = new Date(gap.start);
      const endTime = new Date(startTime.getTime() + slotMinutes * 60000);

      suggestions.push({
        task_id: task.id,
        task_title: task.title,
        suggested_start: startTime.toISOString(),
        suggested_end: endTime.toISOString(),
        reason: `${gap.duration_minutes}分の空き時間に配置（優先度: ${task.priority}）`,
        confidence: task.priority === "urgent" ? 95 : task.priority === "high" ? 88 : 75,
      });

      gap.start = endTime.toISOString();
      gap.duration_minutes -= slotMinutes;
      remaining -= slotMinutes;
    }
  }

  return suggestions;
}

async function handleSchedule(
  userId: string,
  tasks: TaskInput[],
  events: EventInput[],
  dateStr: string
): Promise<ScheduleResult> {
  const gaps = calculateGaps(events, dateStr);
  const suggestions = scheduleTasksInGaps(tasks, gaps);

  const supabase = getServiceClient();

  // Store suggestions
  if (suggestions.length > 0) {
    const rows = suggestions.map((s) => ({
      user_id: userId,
      type: "schedule",
      title: s.task_title,
      description: s.reason,
      task_id: s.task_id,
      suggested_start: s.suggested_start,
      suggested_end: s.suggested_end,
      confidence: s.confidence,
    }));
    await supabase.from("ai_suggestions").insert(rows);
  }

  const totalScheduled = suggestions.reduce((sum, s) => {
    return sum + (new Date(s.suggested_end).getTime() - new Date(s.suggested_start).getTime()) / 60000;
  }, 0);

  const summary = `${suggestions.length}件のタスクを${gaps.length}箇所の空き時間に配置しました（合計${Math.round(totalScheduled)}分）`;

  return { suggestions, gaps, summary };
}

async function handleSplitTask(
  userId: string,
  taskId: string,
  chunkMinutes: number
) {
  const supabase = getServiceClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !task) {
    return { error: "Task not found" };
  }

  const totalMinutes = task.estimated_minutes;
  const chunkSize = chunkMinutes || 60;
  const numChunks = Math.ceil(totalMinutes / chunkSize);
  const subtasks: { id: string; title: string }[] = [];

  for (let i = 0; i < numChunks; i++) {
    const startMin = i * chunkSize;
    const endMin = Math.min((i + 1) * chunkSize, totalMinutes);
    const title = `${task.title} (${startMin}-${endMin}分)`;

    const { data: subtask, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title,
        description: `「${task.title}」の分割タスク ${i + 1}/${numChunks}`,
        priority: task.priority,
        estimated_minutes: endMin - startMin,
        due_date: task.due_date,
        project_id: task.project_id,
        tags: task.tags,
        parent_task_id: taskId,
      })
      .select()
      .single();

    if (!insertError && subtask) {
      subtasks.push({ id: subtask.id, title: subtask.title });
    }
  }

  return { subtasks };
}

async function handlePrompt(
  userId: string,
  prompt: string,
  context: { tasks?: TaskInput[]; events?: EventInput[] } | undefined
) {
  const supabase = getServiceClient();

  // Generate a contextual response based on the prompt and context
  let response = "";
  let suggestions: ScheduleSuggestion[] = [];

  const taskCount = context?.tasks?.length ?? 0;
  const eventCount = context?.events?.length ?? 0;

  if (prompt.match(/スケジュール|予定|配置|空き時間|スケジューリング/i)) {
    if (context?.tasks && context.tasks.length > 0) {
      const dateStr = new Date().toISOString().split("T")[0];
      const events = context.events ?? [];
      const gaps = calculateGaps(events, dateStr);
      suggestions = scheduleTasksInGaps(context.tasks, gaps);
      response = `${suggestions.length}件のタスクを空き時間に配置しました。${gaps.length}箇所の空き時間（合計${gaps.reduce((s, g) => s + g.duration_minutes, 0)}分）を検出しました。優先度の高いタスクから順に配置しています。`;
    } else {
      response = "タスクがありません。まずタスクを追加してください。";
    }
  } else if (prompt.match(/分割|分ける|細分化|サブタスク/i)) {
    response = "タスクを分割するには、タスクプールの分割ボタンを押してください。見積もり時間に基づいて自動的に分割されます。";
  } else if (prompt.match(/優先度|締め切り|期限|緊急/i)) {
    const urgent = context?.tasks?.filter((t) => t.priority === "urgent") ?? [];
    const high = context?.tasks?.filter((t) => t.priority === "high") ?? [];
    response = `現在のタスク状況: 緊急${urgent.length}件、高優先度${high.length}件。緊急タスクを優先的に処理することをお勧めします。`;
  } else if (prompt.match(/分析|レポート|状況|進捗/i)) {
    const done = context?.tasks?.filter((t) => t.status === "done").length ?? 0;
    const todo = context?.tasks?.filter((t) => t.status === "todo").length ?? 0;
    const inProgress = context?.tasks?.filter((t) => t.status === "in_progress").length ?? 0;
    response = `タスク進捗: 完了${done}件、進行中${inProgress}件、未着手${todo}件。本日の予定は${eventCount}件あります。`;
  } else {
    response = `ご質問ありがとうございます。現在${taskCount}件のタスクと${eventCount}件の予定があります。「スケジュールを組んで」「タスクを分析して」などの指示で、より具体的な提案ができます。`;
  }

  // Store the prompt and response
  await supabase.from("ai_prompts").insert({
    user_id: userId,
    prompt,
    response,
    context: context as any,
  });

  return { response, suggestions: suggestions.length > 0 ? suggestions : undefined };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/ai-scheduler", "");

    const user = await getUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    let result: unknown;

    if (path === "/schedule") {
      result = await handleSchedule(user.id, body.tasks ?? [], body.events ?? [], body.date ?? new Date().toISOString().split("T")[0]);
    } else if (path === "/split-task") {
      result = await handleSplitTask(user.id, body.taskId, body.chunkMinutes ?? 60);
    } else if (path === "/prompt") {
      result = await handlePrompt(user.id, body.prompt ?? "", body.context);
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
