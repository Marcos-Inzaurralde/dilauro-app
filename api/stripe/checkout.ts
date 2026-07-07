/**
 * AION — Stripe Checkout Session (Vercel Edge Function)
 * Creates a Checkout Session for plan upgrades.
 */
export const config = { runtime: "edge" };

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://marcosinzaurralde95-dilauro-app.vercel.app";

// Plan → Stripe Price mapping (create these in Stripe Dashboard)
const PRICE_MAP: Record<string, { monthly: string; annual: string }> = {
  price_pro_monthly: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly_placeholder",
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "price_pro_annual_placeholder",
  },
  price_team_monthly: {
    monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY || "price_team_monthly_placeholder",
    annual: process.env.STRIPE_PRICE_TEAM_ANNUAL || "price_team_annual_placeholder",
  },
};

async function stripeAPI(path: string, body: Record<string, string>) {
  const params = new URLSearchParams(body);
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  if (!STRIPE_SECRET) {
    return new Response(
      JSON.stringify({ error: "Stripe not configured" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }

  try {
    const { priceId, userId, email, annual } = await req.json();

    const priceConfig = PRICE_MAP[priceId];
    if (!priceConfig) {
      return new Response(
        JSON.stringify({ error: "Invalid price" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const stripePriceId = annual ? priceConfig.annual : priceConfig.monthly;

    const session = await stripeAPI("/checkout/sessions", {
      "mode": "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price]": stripePriceId,
      "line_items[0][quantity]": "1",
      "success_url": `${APP_URL}/settings?checkout=success`,
      "cancel_url": `${APP_URL}/pricing?checkout=cancelled`,
      "customer_email": email || "",
      "client_reference_id": userId || "",
      "metadata[user_id]": userId || "",
      "metadata[plan]": priceId,
      "allow_promotion_codes": "true",
    });

    if (session.error) {
      return new Response(
        JSON.stringify({ error: session.error.message }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
}
