// ─────────────────────────────────────────────────────────────
// AION — Supabase Data Layer
// ─────────────────────────────────────────────────────────────
// Persists projects, chats, and strategy results in Supabase.
// Falls back gracefully to localStorage when tables don't exist yet.
// ─────────────────────────────────────────────────────────────
import { supabase, isSupabaseConfigured } from "../config/supabase";
import type { Project, ChatHistory, ChatMessage } from "../types";

// ─── Projects ─────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(rowToProject);
  } catch (e) {
    console.warn("[AION DB] fetchProjects failed, using localStorage:", e);
    return [];
  }
}

export async function upsertProject(project: Project, userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("projects").upsert(
      {
        id: project.id,
        user_id: userId,
        client_id: project.id,
        name: project.name,
        type: project.type,
        description: project.description,
        status: project.status,
        roadmap: project.roadmap,
        integrations: project.integrations,
        created_at: project.createdAt,
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  } catch (e) {
    console.warn("[AION DB] upsertProject failed:", e);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) throw error;
  } catch (e) {
    console.warn("[AION DB] deleteProject failed:", e);
  }
}

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    type: (row.type as string) || "SaaS",
    description: (row.description as string) || "",
    status: (row.status as Project["status"]) || "active",
    roadmap: (row.roadmap as Project["roadmap"]) || {
      summary: "",
      phases: [],
      kpis: [],
      risks: [],
      stack: [],
    },
    createdAt: (row.created_at as string) || new Date().toISOString(),
    integrations: (row.integrations as Record<string, unknown> as Project["integrations"]) || {},
  };
}

// ─── Chats ────────────────────────────────────────────────────

export async function fetchChats(): Promise<ChatHistory> {
  if (!isSupabaseConfigured) return {};
  try {
    const { data, error } = await supabase.from("chats").select("*");
    if (error) throw error;

    const history: ChatHistory = {};
    for (const row of data || []) {
      history[row.mode as string] = (row.messages as ChatMessage[]) || [];
    }
    return history;
  } catch (e) {
    console.warn("[AION DB] fetchChats failed:", e);
    return {};
  }
}

export async function saveChat(
  mode: string,
  messages: ChatMessage[],
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("chats").upsert(
      {
        user_id: userId,
        mode,
        messages,
      },
      { onConflict: "user_id,mode" }
    );
    if (error) throw error;
  } catch (e) {
    console.warn("[AION DB] saveChat failed:", e);
  }
}

export async function clearChat(mode: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("mode", mode);
    if (error) throw error;
  } catch (e) {
    console.warn("[AION DB] clearChat failed:", e);
  }
}

// ─── Strategy Results ─────────────────────────────────────────

export async function saveStrategyResult(
  sessionType: string,
  context: string,
  result: string,
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("strategy_results").insert({
      user_id: userId,
      session_type: sessionType,
      context,
      result,
    });
    if (error) throw error;
  } catch (e) {
    console.warn("[AION DB] saveStrategyResult failed:", e);
  }
}

// ─── Health check — test if tables exist ──────────────────────

let _tablesReady: boolean | null = null;

export async function checkTablesExist(): Promise<boolean> {
  if (_tablesReady !== null) return _tablesReady;
  if (!isSupabaseConfigured) {
    _tablesReady = false;
    return false;
  }
  try {
    const { error } = await supabase.from("projects").select("id").limit(1);
    _tablesReady = !error;
    return _tablesReady;
  } catch {
    _tablesReady = false;
    return false;
  }
}
