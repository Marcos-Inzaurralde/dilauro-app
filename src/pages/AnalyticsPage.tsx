// ─────────────────────────────────────────────────────────────
// AION — Analytics Dashboard (Tailwind)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { ChatHistory, Project } from "../types";
import { MODES } from "../config/constants";
import type { ModeName } from "../types";

interface AnalyticsPageProps {
  chatHistory: ChatHistory;
  projects: Project[];
  strategyCount: number;
}

interface DailyCount {
  date: string;
  count: number;
}

export function AnalyticsPage({ chatHistory, projects, strategyCount }: AnalyticsPageProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  // Compute metrics from chat history
  const totalMessages = Object.values(chatHistory).reduce((s, m) => s + m.length, 0);
  const userMessages = Object.values(chatHistory).reduce(
    (s, m) => s + m.filter((msg) => msg.role === "user").length,
    0
  );
  const aiResponses = totalMessages - userMessages;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;

  // Mode distribution
  const modeData = (Object.entries(MODES) as [ModeName, typeof MODES.strategy][]).map(([k, v]) => ({
    mode: k,
    label: v.label,
    emoji: v.emoji,
    color: v.color,
    messages: (chatHistory[k] || []).length,
    userMsgs: (chatHistory[k] || []).filter((m) => m.role === "user").length,
  })).sort((a, b) => b.messages - a.messages);

  const totalModeMessages = modeData.reduce((s, m) => s + m.messages, 0) || 1;

  // Average messages per mode
  const avgPerMode = totalMessages / Math.max(1, Object.keys(chatHistory).length);

  // Most used mode
  const topMode = modeData[0];

  // Estimated AI tokens (rough: avg 150 tokens per message)
  const estTokens = aiResponses * 150;

  const kpiCards = [
    { label: "Mensajes Totales", value: totalMessages, color: "text-aion-accent", icon: "💬" },
    { label: "Prompts Enviados", value: userMessages, color: "text-aion-cyan", icon: "📤" },
    { label: "Respuestas IA", value: aiResponses, color: "text-aion-green", icon: "🤖" },
    { label: "Estrategias", value: strategyCount, color: "text-aion-amber", icon: "♟️" },
    { label: "Proyectos Activos", value: activeProjects, color: "text-purple-400", icon: "🚀" },
    { label: "Completados", value: completedProjects, color: "text-emerald-400", icon: "✅" },
  ];

  return (
    <div className="p-5 max-w-[860px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[19px] font-black tracking-tight mb-1">
            📊 Analytics
          </h1>
          <p className="text-aion-muted text-[11px]">
            Métricas de uso, rendimiento IA y actividad del workspace.
          </p>
        </div>
        <div className="flex gap-1">
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                timeRange === r
                  ? "bg-aion-accent text-white"
                  : "bg-white/5 text-aion-muted hover:bg-white/10"
              }`}
            >
              {r === "7d" ? "7 días" : r === "30d" ? "30 días" : "Todo"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 mb-5">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="glass px-3 py-4 text-center">
            <div className="text-[18px] mb-1">{kpi.icon}</div>
            <div className={`text-[24px] font-black tracking-tighter ${kpi.color}`}>
              {kpi.value}
            </div>
            <div className="text-[9px] text-aion-muted mt-1 font-semibold">
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode Distribution */}
        <div className="glass p-5">
          <div className="label-upper mb-4">DISTRIBUCIÓN POR MODO</div>
          {modeData.map((md) => {
            const pct = Math.round((md.messages / totalModeMessages) * 100);
            return (
              <div key={md.mode} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">{md.emoji}</span>
                    <span className="text-[12px] font-semibold">{md.label}</span>
                  </div>
                  <div className="text-[11px] text-aion-muted">
                    {md.messages} msgs · {pct}%
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(2, pct)}%`,
                      background: md.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="glass p-5">
          <div className="label-upper mb-4">INSIGHTS</div>
          <div className="space-y-3">
            {topMode && topMode.messages > 0 && (
              <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                <span className="text-[20px]">{topMode.emoji}</span>
                <div>
                  <div className="text-[12px] font-bold">Modo más usado</div>
                  <div className="text-[11px] text-aion-muted">
                    {topMode.label} con {topMode.messages} mensajes ({Math.round((topMode.messages / totalModeMessages) * 100)}%)
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
              <span className="text-[20px]">📊</span>
              <div>
                <div className="text-[12px] font-bold">Promedio por modo</div>
                <div className="text-[11px] text-aion-muted">
                  {Math.round(avgPerMode)} mensajes promedio por modo activo
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
              <span className="text-[20px]">⚡</span>
              <div>
                <div className="text-[12px] font-bold">Tokens estimados</div>
                <div className="text-[11px] text-aion-muted">
                  ~{estTokens.toLocaleString()} tokens de IA consumidos
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
              <span className="text-[20px]">🎯</span>
              <div>
                <div className="text-[12px] font-bold">Eficiencia</div>
                <div className="text-[11px] text-aion-muted">
                  {userMessages > 0
                    ? `${(aiResponses / userMessages).toFixed(1)} respuestas por prompt`
                    : "Sin datos todavía"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Status */}
        <div className="glass p-5">
          <div className="label-upper mb-4">ESTADO DE PROYECTOS</div>
          {projects.length === 0 ? (
            <div className="text-center py-6 text-aion-muted text-sm">
              Sin proyectos todavía
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { status: "active", label: "Activos", color: "#10B981", count: activeProjects },
                { status: "paused", label: "Pausados", color: "#F59E0B", count: projects.filter((p) => p.status === "paused").length },
                { status: "completed", label: "Completados", color: "#7C3AED", count: completedProjects },
              ].map((s) => (
                <div key={s.status} className="flex items-center justify-between py-2 border-b border-aion-border last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-[12px] font-semibold">{s.label}</span>
                  </div>
                  <span className="text-[13px] font-bold" style={{ color: s.color }}>{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="glass p-5">
          <div className="label-upper mb-4">ACTIVIDAD RECIENTE</div>
          {projects.length === 0 && totalMessages === 0 ? (
            <div className="text-center py-6 text-aion-muted text-sm">
              Sin actividad todavía
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-aion-border last:border-0">
                  <span className="text-[14px]">🚀</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate">{p.name}</div>
                    <div className="text-[10px] text-aion-muted">
                      {new Date(p.createdAt).toLocaleDateString("es")} · {p.type}
                    </div>
                  </div>
                  <span className={`tag text-[10px] ${
                    p.status === "active"
                      ? "bg-aion-green/10 text-aion-green border border-aion-green/20"
                      : "bg-white/5 text-aion-muted border border-aion-border"
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
