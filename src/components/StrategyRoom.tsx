// ─────────────────────────────────────────────────────────────
// AION — Strategy Room (Tailwind + Supabase persistence)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import type { StrategySession, Project } from "../types";
import { STRATEGY_SESSIONS, STRATEGY_PROMPTS } from "../config/constants";
import { callAI } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { saveStrategyResult } from "../lib/db";
import { exportStrategy } from "../utils/exportPdf";

interface StrategyRoomProps {
  addToast: (msg: string, type?: "info" | "success" | "error") => void;
  projects?: Project[];
}

export function StrategyRoom({ addToast, projects = [] }: StrategyRoomProps) {
  const { user } = useAuth();
  const [sel, setSel] = useState<StrategySession | null>(null);
  const [ctx, setCtx] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Build date + project context block
  const buildContext = (): string => {
    const today = new Date().toLocaleDateString("es-ES", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    let block = `\nFecha actual: ${today}.\n`;

    const active = projects
      .filter((p) => p.status === "active")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (active.length > 0) {
      const p = active[0];
      block += `\nContexto del proyecto: ${p.name} (${p.type}).`;
      if (p.description) block += ` ${p.description}.`;
      if (p.roadmap?.stack?.length > 0)
        block += ` Stack: ${p.roadmap.stack.join(", ")}.`;
      block += `\nUsá este contexto para personalizar el análisis. No inventes datos.\n`;
    }
    return block;
  };

  const run = async () => {
    if (!sel || !ctx.trim() || loading) return;
    setLoading(true);
    setResult("");
    setSaved(false);
    try {
      const cfg = STRATEGY_PROMPTS[sel.id];
      const contextBlock = buildContext();
      const res = await callAI(
        [{ role: "user", content: ctx }],
        cfg.sys + ctx + contextBlock + ". Responde en español. Sé exhaustivo, usa estructura clara con secciones y sub-puntos.",
        [], cfg.tokens
      );
      setResult(res);
    } catch (e) {
      addToast((e as Error).message, "error");
      setResult("Error: " + (e as Error).message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!sel) return;
    try {
      // Save to Supabase if available
      if (user) {
        await saveStrategyResult(sel.id, ctx, result, user.id);
      }
      setSaved(true);
      addToast(`${sel.label} guardado`, "success");
    } catch {
      addToast("No se pudo guardar", "error");
    }
  };

  return (
    <div className="p-5 max-w-[780px] mx-auto">
      <h1 className="text-[19px] font-black tracking-tight mb-[3px]">
        ♟️ Strategy Room
      </h1>
      <p className="text-aion-muted text-[11px] mb-5">
        Sesiones de estrategia profunda con IA.
      </p>

      {/* Session selector */}
      <div className="grid grid-cols-3 gap-2 mb-[18px]">
        {STRATEGY_SESSIONS.map((ss) => (
          <button
            key={ss.id}
            onClick={() => { setSel(ss); setResult(""); setSaved(false); }}
            className={`glass p-3.5 cursor-pointer text-left transition-all ${
              sel?.id === ss.id
                ? "!bg-aion-accent/10 !border-aion-accent/40"
                : "hover:border-white/[0.15]"
            }`}
          >
            <div className="text-[20px] mb-[5px]">{ss.emoji}</div>
            <div className={`text-xs font-bold ${
              sel?.id === ss.id ? "text-purple-400" : "text-aion-text"
            }`}>
              {ss.label}
            </div>
            <div className="text-[10px] text-slate-800 mt-[3px]">{ss.desc}</div>
          </button>
        ))}
      </div>

      {/* Input + Result */}
      {sel && (
        <div className="flex flex-col gap-3">
          <div className="glass p-[18px]">
            <label className="label-upper">DESCRIBE TU NEGOCIO O CONTEXTO</label>
            <textarea
              value={ctx}
              onChange={(e) => setCtx(e.target.value)}
              placeholder="Ej: SaaS de gestión de inventarios para restaurantes en LATAM. Actualmente en beta, 50 usuarios piloto. Precio: $49/mes. Competidores: X, Y, Z."
              className="input-base mt-2 min-h-[90px] resize-y"
            />
            <button
              onClick={run}
              disabled={loading || !ctx.trim()}
              className="btn-primary mt-2.5"
            >
              {loading
                ? `⏳ Generando ${sel.label}...`
                : `${sel.emoji} Generar ${sel.label}`}
            </button>
          </div>

          {result && (
            <div className="glass p-5">
              <div className="flex items-center justify-between mb-3.5">
                <div className="label-upper">
                  {sel.emoji} {sel.label.toUpperCase()} · RESULTADO
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => sel && exportStrategy(sel.label, sel.emoji, ctx, result)}
                    className="btn-outline text-[11px] px-3 py-1 border-slate-600 text-slate-500 hover:text-slate-400"
                  >
                    📄 Exportar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saved}
                    className={`btn-outline text-[11px] px-3 py-1 border-aion-green text-aion-green ${
                      saved ? "opacity-50" : "hover:bg-aion-green/10"
                    }`}
                  >
                    {saved ? "✓ Guardado" : "💾 Guardar"}
                  </button>
                </div>
              </div>
              <div className="text-[13px] leading-[1.85] text-slate-400 whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
