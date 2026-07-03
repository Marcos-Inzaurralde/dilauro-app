// ─────────────────────────────────────────────────────────────
// AION — Integrations Hub (Tailwind)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import type { MCPIntegration } from "../types";
import { MCP_LIST } from "../config/constants";
import { callAI } from "../config/api";

interface IntegrationsHubProps {
  addToast: (msg: string, type?: "info" | "success" | "error") => void;
}

export function IntegrationsHub({ addToast }: IntegrationsHubProps) {
  const [sel, setSel] = useState<MCPIntegration | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!sel || !prompt.trim() || loading) return;
    setLoading(true);
    setResult("");
    try {
      const res = await callAI(
        [{ role: "user", content: prompt }],
        `Eres un asistente que usa herramientas de ${sel.label} via MCP. Ejecuta la acción y reporta qué hiciste con detalles. Responde en español.`,
        [{ type: "url", url: sel.url, name: sel.name }],
        2000
      );
      setResult(res);
      addToast(`${sel.label} ejecutado`, "success");
    } catch (e) {
      setResult(`⚠️ Error: ${(e as Error).message}`);
      addToast(`Error con ${sel.label}`, "error");
    }
    setLoading(false);
  };

  return (
    <div className="p-5 max-w-[780px] mx-auto">
      <h1 className="text-[19px] font-black tracking-tight mb-[3px]">
        🔗 Integrations Hub
      </h1>
      <p className="text-aion-muted text-[11px] mb-5">
        {MCP_LIST.length} herramientas reales vía MCP · Conecta con Notion, Gmail, Calendar, Figma, Canva y más.
      </p>

      {/* Integration cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {MCP_LIST.map((mcp) => (
          <button
            key={mcp.name}
            onClick={() => { setSel(mcp); setResult(""); }}
            className={`glass p-[14px] cursor-pointer text-center transition-all ${
              sel?.name === mcp.name ? "!border-opacity-50" : "hover:border-white/[0.15]"
            }`}
            style={{
              borderColor: sel?.name === mcp.name ? mcp.color : undefined,
            }}
          >
            <div className="text-[26px] mb-1.5">{mcp.icon}</div>
            <div className="text-xs font-bold text-aion-text">{mcp.label}</div>
            <div className="text-[9px] text-slate-800 mt-0.5">MCP</div>
          </button>
        ))}
      </div>

      {/* Action panel */}
      {sel && (
        <div className="glass p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-[26px]">{sel.icon}</span>
            <div>
              <div className="text-sm font-bold" style={{ color: sel.color }}>
                {sel.label}
              </div>
              <div className="text-[10px] text-slate-800 truncate max-w-[300px]">
                {sel.url}
              </div>
            </div>
          </div>

          <label className="label-upper">¿QUÉ QUERÉS HACER?</label>
          <div className="flex gap-2 mt-1.5">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder={`Ej: Lista mis páginas de ${sel.label}`}
              className="input-base flex-1"
            />
            <button
              onClick={run}
              disabled={loading || !prompt.trim()}
              className="btn-primary min-w-[80px]"
              style={{ background: sel.color, borderColor: sel.color }}
            >
              {loading ? "⏳" : "Ejecutar"}
            </button>
          </div>

          {result && (
            <div className="mt-4 bg-white/[0.03] border border-aion-border rounded-xl p-4">
              <div className="label-upper mb-2.5">RESULTADO</div>
              <div className="text-[13px] leading-[1.8] text-slate-400 whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
