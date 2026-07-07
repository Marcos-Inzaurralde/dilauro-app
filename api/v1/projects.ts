/**
 * AION — Public API: Projects (Vercel Edge Function)
 * GET /api/v1/projects — List user's projects
 * POST /api/v1/projects — Create a new project
 *
 * Auth: Bearer token (Supabase JWT)
 */
export const config = { runtime: "edge" };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

function corsHeaders(origin?: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

async function supabaseReq(
  method: string,
  path: string,
  token: string,
  body?: unknown
) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

export default async function handler(req: Request) {
  const origin = req.headers.get("origin");
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Extract auth token
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      { status: 401, headers }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({ error: "API not configured" }),
      { status: 500, headers }
    );
  }

  try {
    if (req.method === "GET") {
      const { status, data } = await supabaseReq(
        "GET",
        "/projects?select=*&order=created_at.desc",
        auth
      );
      return new Response(
        JSON.stringify({ projects: data || [], count: (data || []).length }),
        { status, headers }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { name, type, description } = body;

      if (!name) {
        return new Response(
          JSON.stringify({ error: "name is required" }),
          { status: 400, headers }
        );
      }

      // Get user ID from Supabase auth
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${auth}`,
        },
      });
      const userData = await userRes.json();
      if (!userData?.id) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers }
        );
      }

      const id = crypto.randomUUID();
      const project = {
        id,
        user_id: userData.id,
        client_id: id,
        name,
        type: type || "SaaS",
        description: description || "",
        status: "active",
        roadmap: { summary: "", phases: [], kpis: [], risks: [], stack: [] },
        integrations: {},
      };

      const { status, data } = await supabaseReq("POST", "/projects", auth, project);
      return new Response(
        JSON.stringify({ project: data?.[0] || project }),
        { status: status === 201 ? 201 : status, headers }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers }
    );
  }
}
