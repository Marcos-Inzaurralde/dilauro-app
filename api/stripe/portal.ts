/**
 * AION — Stripe Customer Portal (Vercel Edge Function)
 * Creates a billing portal session for subscription management.
 */
export const config = { runtime: "edge" };

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://marcosinzaurralde95-dilauro-app.vercel.app";

async function stripeAPI(method: string, path: string, body?: Record<string, string>) {
  const params = body ? new URLSearchParams(body) : undefined;
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params?.toString(),
  });
  return res.json();
}

function corsHeaders(origin?: string | null): Record<string, string> {
  const allowed = origin && origin.endsWith(".vercel.app") ? origin : APP_URL;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default async function handler(req: Request) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (!STRIPE_SECRET) {
    return new Response(
      JSON.stringify({ error: "Stripe not configured" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }

  try {
    const { userId } = await req.json();

    // Find customer by metadata
    const customers = await stripeAPI("GET",
      `/customers?limit=1&query=metadata['user_id']:'${userId}'`
    );

    if (!customers.data || customers.data.length === 0) {
      return new Response(
        JSON.stringify({ error: "No subscription found" }),
        { status: 404, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const customerId = customers.data[0].id;

    const session = await stripeAPI("POST", "/billing_portal/sessions", {
      customer: customerId,
      return_url: `${APP_URL}/settings`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
}
