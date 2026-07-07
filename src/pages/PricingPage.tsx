// ─────────────────────────────────────────────────────────────
// AION — Pricing Page (Tailwind)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface PricingPageProps {
  addToast: (msg: string, type?: "info" | "success" | "error") => void;
  currentPlan: string;
}

const PLANS = [
  {
    id: "free",
    name: "Starter",
    price: 0,
    priceLabel: "Gratis",
    period: "",
    color: "#475569",
    features: [
      "1 proyecto activo",
      "50 mensajes IA / día",
      "3 estrategias / mes",
      "Exportar PDF",
      "PWA (instalar como app)",
    ],
    limits: [
      "Sin integraciones MCP",
      "Sin equipos",
      "Sin API",
    ],
    cta: "Plan actual",
    priceId: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    priceLabel: "$19",
    period: "/mes",
    color: "#7C3AED",
    popular: true,
    features: [
      "Proyectos ilimitados",
      "Mensajes IA ilimitados",
      "Estrategias ilimitadas",
      "Todas las integraciones MCP",
      "Exportar PDF",
      "Analytics básico",
      "Soporte prioritario",
    ],
    limits: [
      "1 miembro de equipo",
    ],
    cta: "Comenzar Pro",
    priceId: "price_pro_monthly",
  },
  {
    id: "team",
    name: "Team",
    price: 49,
    priceLabel: "$49",
    period: "/mes",
    color: "#06B6D4",
    features: [
      "Todo de Pro",
      "Hasta 10 miembros",
      "Roles y permisos",
      "API pública",
      "Analytics avanzado",
      "Workspace compartido",
      "Onboarding dedicado",
    ],
    limits: [],
    cta: "Comenzar Team",
    priceId: "price_team_monthly",
  },
];

export function PricingPage({ addToast, currentPlan }: PricingPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [annual, setAnnual] = useState(false);

  const handleSubscribe = async (planId: string, priceId: string | null) => {
    if (!priceId || !user) return;
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email,
          annual,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Error al crear checkout");
      }
    } catch (e) {
      addToast((e as Error).message, "error");
    }
    setLoading(null);
  };

  const handleManageBilling = async () => {
    if (!user) return;
    setLoading("manage");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      addToast("Error al abrir portal de billing", "error");
    }
    setLoading(null);
  };

  return (
    <div className="p-5 max-w-[900px] mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-black tracking-tight mb-2">
          💰 Planes y Precios
        </h1>
        <p className="text-aion-muted text-[13px] max-w-[400px] mx-auto">
          Elegí el plan que mejor se adapte a tu negocio.
          Podés cambiar o cancelar en cualquier momento.
        </p>

        {/* Annual toggle */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <span className={`text-xs font-semibold ${!annual ? "text-aion-text" : "text-aion-muted"}`}>
            Mensual
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${
              annual ? "bg-aion-accent" : "bg-white/10"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                annual ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-xs font-semibold ${annual ? "text-aion-text" : "text-aion-muted"}`}>
            Anual
            <span className="text-aion-green text-[10px] ml-1">-20%</span>
          </span>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const displayPrice = annual && plan.price > 0
            ? Math.round(plan.price * 0.8)
            : plan.price;

          return (
            <div
              key={plan.id}
              className={`glass p-6 relative transition-all ${
                plan.popular
                  ? "border-aion-accent/40 shadow-[0_0_30px_rgba(124,58,237,0.08)]"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-aion-accent text-white
                                text-[10px] font-bold px-3 py-0.5 rounded-full tracking-wider">
                  POPULAR
                </div>
              )}

              <div className="mb-5">
                <div
                  className="text-[14px] font-bold mb-1"
                  style={{ color: plan.color }}
                >
                  {plan.name}
                </div>
                <div className="flex items-end gap-0.5">
                  <span className="text-[32px] font-black text-aion-text">
                    {displayPrice === 0 ? "Gratis" : `$${displayPrice}`}
                  </span>
                  {plan.period && (
                    <span className="text-aion-muted text-[13px] mb-1">{plan.period}</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-[12px]">
                    <span className="text-aion-green text-[11px] mt-px">✓</span>
                    <span className="text-aion-text">{f}</span>
                  </div>
                ))}
                {plan.limits.map((l) => (
                  <div key={l} className="flex items-start gap-2 text-[12px]">
                    <span className="text-aion-muted text-[11px] mt-px">✗</span>
                    <span className="text-aion-muted">{l}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-lg text-[13px] font-semibold
                             bg-white/5 border border-aion-border text-aion-muted cursor-default"
                >
                  Plan actual ✓
                </button>
              ) : plan.priceId ? (
                <button
                  onClick={() => handleSubscribe(plan.id, plan.priceId)}
                  disabled={loading === plan.id}
                  className="w-full py-2.5 rounded-lg text-[13px] font-bold
                             text-white cursor-pointer transition-all hover:brightness-110
                             disabled:opacity-40"
                  style={{ background: plan.color }}
                >
                  {loading === plan.id ? "Procesando..." : plan.cta}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-lg text-[13px] font-semibold
                             bg-white/5 border border-aion-border text-aion-muted cursor-default"
                >
                  {plan.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Manage billing */}
      {currentPlan !== "free" && (
        <div className="text-center mt-6">
          <button
            onClick={handleManageBilling}
            disabled={loading === "manage"}
            className="btn-outline border-aion-border text-aion-muted text-xs hover:text-aion-text"
          >
            {loading === "manage" ? "Abriendo..." : "📋 Gestionar facturación"}
          </button>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-10 glass p-6">
        <div className="label-upper mb-4">PREGUNTAS FRECUENTES</div>
        {[
          {
            q: "¿Puedo cancelar en cualquier momento?",
            a: "Sí, sin compromisos. Tu plan se mantiene hasta el fin del período facturado.",
          },
          {
            q: "¿Hay límite de proyectos en Free?",
            a: "El plan Free permite 1 proyecto activo. Upgradeá a Pro para proyectos ilimitados.",
          },
          {
            q: "¿Cómo funciona el plan Team?",
            a: "Invitá hasta 10 miembros a tu workspace. Cada uno tiene su Co-Pilot y proyectos.",
          },
          {
            q: "¿Los pagos son seguros?",
            a: "Procesamos todos los pagos vía Stripe. AION nunca almacena datos de tu tarjeta.",
          },
        ].map(({ q, a }) => (
          <div key={q} className="py-3 border-b border-aion-border last:border-0">
            <div className="text-[13px] font-bold text-aion-text mb-1">{q}</div>
            <div className="text-[12px] text-aion-muted">{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
