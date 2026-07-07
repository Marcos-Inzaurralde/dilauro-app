/**
 * AION — Public API: Strategy Results (Vercel Edge Function)
 * GET /api/v1/strategy — List strategy results
 * POST /api/v1/strategy — Run a strategy session via API
 *
 * Auth: Bearer token (Supabase JWT)
 */
export const config = { runtime: "edge" };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const STRATEGY_PROMPTS: Record<string, { sys: string; tokens: number }> = {
  swot: { sys: "Eres consultor estratégico senior. Genera un análisis FODA conciso y accionable. Responde SOLO en español. Para: ", tokens: 1500 },
  canvas: { sys: "Eres experto en Business Model Canvas. Genera los 9 bloques con detalles. Responde SOLO en español. Para: ", tokens: 1500 },
  gtm: { sys: "Eres experto en go-to-market. Genera estrategia GTM completa. Responde SOLO en español. Para: ", tokens: 1500 },
  pricing: { sys: "Eres experto en pricing strategy SaaS. Genera estructura de precios. Responde SOLO en español. Para: ", tokens: 1500 },
  okr: { sys: "Eres experto en OKRs. Genera OKRs para 2 trimestres. Responde SOLO en español. Para: ", tokens: 1500 },
  tam: { sys: "Eres analista de mercado. Calcula TAM/SAM/SOM con metodología top-down. Responde SOLO en español. Para: ", tokens: 1500 },
};

const MODEL_CHAIN = [
  "deepseek/deepseek-v4-flash:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-31b-it:free",
];

function corsHeaders(origin?: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

async function supabaseReq(method: string, path: string, token: string, body?: unknown) {
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

async function callAI(prompt: string, system: string, maxTokens: number): Promise<string> {
  for (const model of MODEL_CHAIN) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          max_tokens: maxTokens,
        }),
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } catch {
      continue;
    }
  }
  throw new Error("All AI models failed");
}

export default async function handler(req: Request) {
  const origin = req.headers.get("origin");
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) {
    return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401, headers });
  }

  try {
    if (req.method === "GET") {
      const { status, data } = await supabaseReq(
        "GET",
        "/strategy_results?select=*&order=created_at.desc&limit=50",
        auth
      );
      return new Response(
        JSON.stringify({ results: data || [], count: (data || []).length }),
        { status, headers }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { session_type, context } = body;

      if (!session_type || !context) {
        return new Response(
          JSON.stringify({ error: "session_type and context are required" }),
          { status: 400, headers }
        );
      }

      const cfg = STRATEGY_PROMPTS[session_type];
      if (!cfg) {
        return new Response(
          JSON.stringify({ error: `Invalid session_type. Valid: ${Object.keys(STRATEGY_PROMPTS).join(", ")}` }),
          { status: 400, headers }
        );
      }

      // Get user
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${auth}` },
      });
      const userData = await userRes.json();
      if (!userData?.id) {
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
      }

      // Run AI
      const result = await callAI(context, cfg.sys + context, cfg.tokens);

      // Save to Supabase
      await supabaseReq("POST", "/strategy_results", auth, {
        user_id: userData.id,
        session_type,
        context,
        result,
      });

      return new Response(
        JSON.stringify({ session_type, context, result }),
        { status: 200, headers }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers }
    );
  }
}
