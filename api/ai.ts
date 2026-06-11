/**
 * AION AI Business OS — Vercel Edge Function Proxy
 * ─────────────────────────────────────────────────────────────
 * Vercel Edge Runtime proxy to OpenRouter API.
 * Features: auth, streaming, 5-model fallback chain, rate limiting,
 * restricted CORS, and Anthropic-format SSE transformation.
 *
 * Environment variables (set in Vercel dashboard):
 *   OPENROUTER_API_KEY — your OpenRouter API key (openrouter.ai/keys)
 *   AION_APP_TOKEN     — shared secret between frontend & proxy (optional)
 */

export const config = { runtime: "edge" };

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

const MODEL_CHAIN = [
  "deepseek/deepseek-v4-flash:free",
  "openai/gpt-oss-120b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-31b-it:free",
];

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 30): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Allowed origins — restrict to actual app domains
const ALLOWED_ORIGINS = [
  "https://marcosinzaurralde95-dilauro-app.vercel.app",
  "https://dilauro-app.vercel.app",
];

function corsHeaders(origin?: string | null): Record<string, string> {
  // In development or if origin matches, allow it
  const allowedOrigin =
    origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app"))
      ? origin
      : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

interface MessageBody {
  messages?: Array<{ role: string; content: string }>;
  system?: string;
  max_tokens?: number;
  stream?: boolean;
  mcp_servers?: Array<{ type: string; url: string; name: string }>;
}

function openaiToAnthropicResponse(
  openaiData: Record<string, unknown>
): Record<string, unknown> {
  const choices = (openaiData.choices || []) as Array<{
    message?: { content?: string; role?: string };
    finish_reason?: string;
  }>;
  const textContent = choices
    .map((c) => c.message?.content || "")
    .filter(Boolean)
    .join("\n");
  return {
    id: openaiData.id || `msg_${Date.now()}`,
    type: "message",
    role: "assistant",
    content: [{ type: "text", text: textContent }],
    model: openaiData.model || MODEL_CHAIN[0],
    stop_reason:
      choices[0]?.finish_reason === "stop"
        ? "end_turn"
        : choices[0]?.finish_reason || "end_turn",
    usage: openaiData.usage || { input_tokens: 0, output_tokens: 0 },
  };
}

function transformStreamToAnthropic(
  openaiStream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const reader = openaiStream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let blockStarted = false;

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (blockStarted) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "content_block_stop", index: 0 })}\n\n`
              )
            );
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "message_stop" })}\n\n`
            )
          );
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);

            if (event.error) {
              const errMsg =
                event.error?.message || "Error del proveedor de IA";
              if (!blockStarted) {
                blockStarted = true;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "content_block_start",
                      index: 0,
                      content_block: { type: "text", text: "" },
                    })}\n\n`
                  )
                );
              }
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "content_block_delta",
                    index: 0,
                    delta: {
                      type: "text_delta",
                      text: `⚠️ ${errMsg}`,
                    },
                  })}\n\n`
                )
              );
              continue;
            }

            const choices = (event.choices || []) as Array<{
              delta?: {
                content?: string;
                role?: string;
                reasoning?: string;
              };
              finish_reason?: string | null;
            }>;
            if (!choices.length) continue;

            const contentText = choices[0]?.delta?.content || "";

            if (contentText && !blockStarted) {
              blockStarted = true;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "content_block_start",
                    index: 0,
                    content_block: { type: "text", text: "" },
                  })}\n\n`
                )
              );
            }

            if (contentText) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "content_block_delta",
                    index: 0,
                    delta: { type: "text_delta", text: contentText },
                  })}\n\n`
                )
              );
            }
          } catch {
            continue;
          }
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

async function tryModel(
  model: string,
  apiKey: string,
  payload: Record<string, unknown>
): Promise<Response | null> {
  try {
    const res = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://dilauro-app.vercel.app",
        "X-Title": "AION AI Business OS",
      },
      body: JSON.stringify({ ...payload, model }),
    });
    if (res.status === 404 || res.status === 429 || res.status === 503) {
      return null;
    }
    return res;
  } catch {
    return null;
  }
}

export default async function handler(request: Request) {
  const origin = request.headers.get("Origin");
  const cors = corsHeaders(origin);

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido. Usa POST." }),
      {
        status: 405,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }

  // Auth
  const appToken = process.env.AION_APP_TOKEN;
  if (appToken) {
    const auth = request.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ") || auth.slice(7) !== appToken) {
      return new Response(
        JSON.stringify({ error: "No autorizado. Token inválido." }),
        {
          status: 401,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Rate limiting
  const clientIP =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown";
  if (!checkRateLimit(clientIP)) {
    return new Response(
      JSON.stringify({ error: "Rate limit excedido. Espera un momento." }),
      {
        status: 429,
        headers: {
          ...cors,
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      }
    );
  }

  // Parse body
  let body: MessageBody;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Body inválido. Se esperaba JSON." }),
      {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }

  // Validate
  if (
    !body.messages ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0
  ) {
    return new Response(
      JSON.stringify({
        error: "messages: requerido, debe ser un array no vacío",
      }),
      {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }

  // API key
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Configuración del servidor incompleta. Falta OPENROUTER_API_KEY.",
      }),
      {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }

  const isStreaming = body.stream === true;

  const messages: Array<{ role: string; content: string }> = [];
  if (body.system) {
    messages.push({ role: "system", content: body.system });
  }
  messages.push(...body.messages);

  const basePayload: Record<string, unknown> = {
    max_tokens: Math.min(body.max_tokens || 3000, 8192),
    messages,
    ...(isStreaming ? { stream: true } : {}),
  };

  // Try each model in the fallback chain
  let apiRes: Response | null = null;
  let usedModel = MODEL_CHAIN[0];

  for (const model of MODEL_CHAIN) {
    apiRes = await tryModel(model, apiKey, basePayload);
    if (apiRes) {
      usedModel = model;
      break;
    }
  }

  if (!apiRes) {
    return new Response(
      JSON.stringify({
        error:
          "Todos los modelos gratuitos están temporalmente no disponibles. Intenta de nuevo en unos minutos.",
        tried: MODEL_CHAIN,
      }),
      {
        status: 503,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }

  try {
    if (isStreaming) {
      if (!apiRes.ok) {
        const errBody = await apiRes.text();
        return new Response(
          JSON.stringify({
            error: `Error del proveedor de IA (${apiRes.status})`,
            detail: errBody,
            model: usedModel,
          }),
          {
            status: apiRes.status,
            headers: { ...cors, "Content-Type": "application/json" },
          }
        );
      }
      if (!apiRes.body) {
        return new Response(
          JSON.stringify({ error: "Streaming no disponible." }),
          {
            status: 502,
            headers: { ...cors, "Content-Type": "application/json" },
          }
        );
      }
      const anthropicStream = transformStreamToAnthropic(apiRes.body);
      return new Response(anthropicStream, {
        status: 200,
        headers: {
          ...cors,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-AION-Model": usedModel,
        },
      });
    }

    // Non-streaming
    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      return new Response(
        JSON.stringify({
          error: `Error del proveedor de IA (${apiRes.status})`,
          detail: errBody,
          model: usedModel,
        }),
        {
          status: apiRes.status,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }

    const data = await apiRes.json();
    const anthropicResponse = openaiToAnthropicResponse(data);
    return new Response(JSON.stringify(anthropicResponse), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "X-AION-Model": usedModel,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Error al conectar con la API de IA.",
        detail: (err as Error).message,
      }),
      {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }
}
