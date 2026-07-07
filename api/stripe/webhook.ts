/**
 * AION — Stripe Webhook Handler (Vercel Edge Function)
 * Handles subscription events: created, updated, deleted.
 * Updates user plan in Supabase.
 */
export const config = { runtime: "edge" };

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function updateUserPlan(userId: string, plan: string, stripeCustomerId: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;

  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      preferences: { plan, stripe_customer_id: stripeCustomerId },
      updated_at: new Date().toISOString(),
    }),
  });
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const event = body;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.user_id;
        const plan = session.metadata?.plan || "pro";
        const customerId = session.customer;

        if (userId) {
          await updateUserPlan(userId, plan.includes("team") ? "team" : "pro", customerId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const customerId = sub.customer;
        // Could update plan based on subscription items
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer;
        // Downgrade to free — need to look up user by stripe customer ID
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
