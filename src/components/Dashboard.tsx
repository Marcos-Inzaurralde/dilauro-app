// ─────────────────────────────────────────────────────────────
// AION — Command Center Dashboard (Tailwind) v5.0
// ─────────────────────────────────────────────────────────────
import type { Project, ChatHistory } from "../types";
import { MODES } from "../config/constants";
import type { ModeName } from "../types";

interface DashboardProps {
  projects: Project[];
  chatHistory: ChatHistory;
  strategyCount: number;
  onNavigate: (path: string) => void;
}

export function Dashboard({ projects, chatHistory, strategyCount, onNavigate }: DashboardProps) {
  // Real metrics
  const totalMessages = Object.values(chatHistory).reduce((sum, msgs) => sum + msgs.length, 0);
  const activeProjects = projects.filter((p) => p.status === "active").length;

  const stats = [
    { label: "Proyectos", value: projects.length, color: "text-aion-accent" },
    { label: "Activos", value: activeProjects, color: "text-aion-green" },
    { label: "Mensajes IA", value: totalMessages, color: "text-aion-cyan" },
    { label: "Estrategias", value: strategyCount, color: "text-aion-amber" },
  ];

  // Per-mode message counts
  const modeCounts = (Object.entries(MODES) as [ModeName, typeof MODES.strategy][]).map(([k, v]) => ({
    mode: k,
    label: v.label,
    emoji: v.emoji,
    color: v.color,
    count: (chatHistory[k] || []).filter((m) => m.role === "user").length,
  })).sort((a, b) => b.count - a.count);

  const actions = [
    {
      label: "🧠 AI Co-Pilot",
      sub: "6 modos · Streaming real",
      path: "/copilot",
      border: "border-aion-accent/10 hover:border-aion-accent/25",
    },
    {
      label: "🚀 Nuevo Proyecto",
      sub: "Roadmap generado con IA",
      path: "/projects",
      border: "border-aion-cyan/10 hover:border-aion-cyan/25",
    },
    {
      label: "♟️ Strategy Room",
      sub: "FODA, Canvas, GTM, OKRs, TAM",
      path: "/strategy",
      border: "border-purple-500/10 hover:border-purple-500/25",
    },
    {
      label: "🔗 Integrations Hub",
      sub: "7 herramientas vía MCP",
      path: "/integrations",
      border: "border-aion-green/10 hover:border-aion-green/25",
    },
  ];

  return (
    <div className="px-5 py-6 max-w-[860px] mx-auto">
      {/* Header */}
      <div className="mb-[22px]">
        <h1 className="text-[22px] font-black tracking-tight mb-1">
          ⚡ Command Center
        </h1>
        <p className="text-aion-muted text-xs">
          Sistema Operativo de Negocios con IA · v6.0
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2.5 mb-[18px]">
        {stats.map((st) => (
          <div key={st.label} className="glass px-3.5 py-4">
            <div className={`text-[28px] font-black tracking-tighter ${st.color}`}>
              {st.value}
            </div>
            <div className="text-[10px] text-aion-muted mt-[3px] font-semibold">
              {st.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {actions.map((a) => (
          <button
            key={a.path}
            onClick={() => onNavigate(a.path)}
            className={`glass px-4 py-4 cursor-pointer text-left transition-all duration-[180ms] ${a.border}`}
          >
            <div className="text-[13px] font-bold text-aion-text mb-[3px]">
              {a.label}
            </div>
            <div className="text-[11px] text-aion-muted">{a.sub}</div>
          </button>
        ))}
      </div>

      {/* Two-column: Recent projects + AI Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent projects */}
        <div className="glass p-[18px]">
          <div className="label-upper mb-3.5">PROYECTOS RECIENTES</div>
          {projects.length === 0 ? (
            <div className="text-center py-[18px]">
              <div className="text-[30px] mb-2">🚀</div>
              <div className="text-[13px] text-slate-800 mb-2.5">
                Sin proyectos todavía.
              </div>
              <button
                onClick={() => onNavigate("/projects")}
                className="btn-primary text-xs px-4 py-[7px]"
              >
                Crear primer proyecto →
              </button>
            </div>
          ) : (
            projects.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2.5 border-b border-aion-border last:border-0"
              >
                <div>
                  <div className="text-[13px] font-bold mb-1">{p.name}</div>
                  <div className="flex gap-1.5 items-center">
                    <span className="tag bg-aion-accent/10 text-aion-accent border border-aion-accent/20">
                      {p.type}
                    </span>
                    <span className="text-[10px] text-slate-800">
                      {p.roadmap?.phases?.length || 0} fases
                    </span>
                  </div>
                </div>
                <span className="tag bg-aion-green/10 text-aion-green border border-aion-green/20">
                  {p.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* AI Usage breakdown */}
        <div className="glass p-[18px]">
          <div className="label-upper mb-3.5">USO POR MODO</div>
          {totalMessages === 0 ? (
            <div className="text-center py-[18px]">
              <div className="text-[30px] mb-2">🧠</div>
              <div className="text-[13px] text-slate-800 mb-2.5">
                Aún no has usado el Co-Pilot.
              </div>
              <button
                onClick={() => onNavigate("/copilot")}
                className="btn-primary text-xs px-4 py-[7px]"
              >
                Iniciar chat →
              </button>
            </div>
          ) : (
            modeCounts.map((mc) => (
              <div key={mc.mode} className="flex items-center gap-3 py-2 border-b border-aion-border last:border-0">
                <span className="text-[16px]">{mc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold">{mc.label}</div>
                  <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(4, (mc.count / Math.max(1, modeCounts[0]?.count || 1)) * 100)}%`,
                        background: mc.color,
                      }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-aion-muted">{mc.count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
