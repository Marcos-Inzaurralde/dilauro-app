// ─────────────────────────────────────────────────────────────
// AION — Project Intelligence (Tailwind + React Router)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Project, Roadmap } from "../types";
import { PROJECT_TYPES, ORCHESTRATIONS, MCP_LIST } from "../config/constants";
import { callAI } from "../config/api";

const fmtTime = () =>
  new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

interface ProjectsProps {
  projects: Project[];
  saveProjects: (projects: Project[]) => void;
  removeProject: (id: string) => void;
  addToast: (msg: string, type?: "info" | "success" | "error") => void;
}

export function Projects({ projects, saveProjects, removeProject, addToast }: ProjectsProps) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "create" | "detail">(
    projectId ? "detail" : "list"
  );
  const [sel, setSel] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: "", type: "SaaS", description: "" });
  const [loading, setLoading] = useState(false);
  const [orchLoading, setOrchLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Sync selected project from URL param
  useEffect(() => {
    if (projectId) {
      const found = projects.find((p) => p.id === projectId);
      if (found) {
        setSel(found);
        setView("detail");
      }
    }
  }, [projectId, projects]);

  const create = async () => {
    if (!form.name.trim() || loading) return;
    setLoading(true);
    try {
      const sys = `Responde SOLO con JSON válido. Sin markdown, sin texto extra, sin backticks.
Estructura: {"summary":"resumen 2 líneas","phases":[{"name":"fase","duration":"X sem","tasks":["t1","t2","t3"]}],"kpis":["kpi1","kpi2","kpi3"],"risks":["riesgo1","riesgo2"],"stack":["tech1","tech2"]}
3 fases, 3 tareas c/u, 3 KPIs, 2 riesgos, 4 techs. Responde en español.`;

      const raw = await callAI(
        [{ role: "user", content: `Proyecto: ${form.name} | Tipo: ${form.type} | ${form.description}` }],
        sys, [], 1500
      );

      let roadmap: Roadmap;
      try {
        roadmap = JSON.parse(raw.replace(/```json|```/g, "").trim());
      } catch {
        roadmap = { summary: raw, phases: [], kpis: [], risks: [], stack: [] };
      }

      const project: Project = {
        id: Date.now().toString(),
        ...form,
        status: "active",
        roadmap,
        createdAt: new Date().toISOString(),
        integrations: {},
      };

      const updated = [project, ...projects];
      saveProjects(updated);
      setSel(project);
      setView("detail");
      navigate(`/projects/${project.id}`);
      setForm({ name: "", type: "SaaS", description: "" });
      addToast("Proyecto creado con roadmap IA", "success");
    } catch (e) {
      addToast(`Error al generar roadmap: ${(e as Error).message}`, "error");
    }
    setLoading(false);
  };

  const deleteProject = (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    removeProject(id);
    if (sel?.id === id) {
      setSel(null);
      setView("list");
      navigate("/projects");
    }
    setConfirmDelete(null);
    addToast("Proyecto eliminado", "info");
  };

  const orchestrate = async (project: Project, svcName: string) => {
    const mcp = MCP_LIST.find((m) => m.name === svcName);
    if (!mcp) return;
    setOrchLoading(svcName);

    const prompts: Record<string, string> = {
      notion: `Crea una página en Notion con el proyecto "${project.name}". Tipo: ${project.type}. Descripción: ${project.description}. Roadmap con ${project.roadmap?.phases?.length} fases. KPIs: ${(project.roadmap?.kpis || []).join(", ")}.`,
      calendar: `Crea eventos en Google Calendar para el proyecto "${project.name}". Fases: ${(project.roadmap?.phases || []).map((p, i) => `Fase ${i + 1}: ${p.name} (${p.duration})`).join("; ")}.`,
      gamma: `Crea una presentación ejecutiva en Gamma sobre el proyecto "${project.name}". Tipo: ${project.type}. ${project.description}. Stack: ${(project.roadmap?.stack || []).join(", ")}.`,
      vercel: `Lista mis proyectos en Vercel con estado de deployment actual.`,
    };

    try {
      const reply = await callAI(
        [{ role: "user", content: prompts[svcName] || `Ejecuta acción para ${project.name} via ${svcName}` }],
        `Eres un asistente que usa herramientas MCP de ${mcp.label}. Ejecuta la acción y reporta exactamente qué hiciste con detalles.`,
        [{ type: "url", url: mcp.url, name: mcp.name }], 1500
      );

      const upd: Project = {
        ...project,
        integrations: {
          ...project.integrations,
          [svcName]: { done: true, result: reply, ts: fmtTime() },
        },
      };
      saveProjects(projects.map((p) => (p.id === project.id ? upd : p)));
      setSel(upd);
      addToast(`${mcp.label} sincronizado correctamente`, "success");
    } catch (e) {
      addToast(`Error con ${mcp.label}: ${(e as Error).message}`, "error");
    }
    setOrchLoading(null);
  };

  // ── CREATE VIEW ──────────────────────────────────────────
  if (view === "create")
    return (
      <div className="p-5 max-w-[540px] mx-auto">
        <button
          onClick={() => setView("list")}
          className="bg-transparent border-none text-aion-muted cursor-pointer mb-4 text-[13px] hover:text-aion-text"
        >
          ← Volver
        </button>
        <h1 className="text-[19px] font-black tracking-tight mb-5">
          🚀 Nuevo Proyecto
        </h1>
        <div className="flex flex-col gap-4">
          <div>
            <label className="label-upper">NOMBRE DEL PROYECTO</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: VORTEX, ContentOS, FinanceAI..."
              className="input-base mt-1.5"
            />
          </div>
          <div>
            <label className="label-upper">TIPO</label>
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`px-3 py-[5px] rounded-[7px] text-xs cursor-pointer font-semibold
                    transition-all ${
                      form.type === t
                        ? "bg-aion-accent border border-aion-accent text-white"
                        : "bg-transparent border border-white/[0.09] text-aion-muted hover:border-white/20"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-upper">DESCRIPCIÓN</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="¿Qué problema resuelve? ¿A quién va dirigido? ¿Modelo de negocio? Cuanta más info, mejor el roadmap."
              className="input-base mt-1.5 min-h-[90px] resize-y"
            />
          </div>
          <button
            onClick={create}
            disabled={loading || !form.name.trim()}
            className="btn-primary py-3 text-sm font-bold"
          >
            {loading ? "⏳ Generando roadmap con IA..." : "🚀 Crear Proyecto con IA"}
          </button>
        </div>
      </div>
    );

  // ── DETAIL VIEW ──────────────────────────────────────────
  if (view === "detail" && sel)
    return (
      <div className="p-5 max-w-[780px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setView("list"); navigate("/projects"); }}
            className="bg-transparent border-none text-aion-muted cursor-pointer text-[13px] hover:text-aion-text"
          >
            ← Proyectos
          </button>
          <button
            onClick={() => deleteProject(sel.id)}
            className={`btn-outline text-[11px] px-3 py-1 ${
              confirmDelete === sel.id
                ? "border-aion-red text-aion-red"
                : "border-aion-red/50 text-aion-red/80 hover:text-aion-red"
            }`}
          >
            {confirmDelete === sel.id ? "¿Confirmar?" : "🗑 Eliminar"}
          </button>
        </div>

        <div className="mb-4">
          <h1 className="text-[22px] font-black tracking-tight mb-2">{sel.name}</h1>
          <div className="flex gap-1.5">
            <span className="tag bg-aion-accent/10 text-aion-accent border border-aion-accent/20">
              {sel.type}
            </span>
            <span className="tag bg-aion-green/10 text-aion-green border border-aion-green/20">
              {sel.status}
            </span>
            <span className="text-[10px] text-slate-800 flex items-center">
              {new Date(sel.createdAt).toLocaleDateString("es")}
            </span>
          </div>
        </div>

        {/* Summary */}
        {sel.roadmap?.summary && (
          <div className="glass p-4 mb-3">
            <div className="label-upper mb-2">RESUMEN IA</div>
            <p className="text-[13px] leading-[1.75] text-slate-400">
              {sel.roadmap.summary}
            </p>
          </div>
        )}

        {/* Roadmap phases */}
        {sel.roadmap?.phases?.length > 0 && (
          <div className="glass p-[18px] mb-3">
            <div className="label-upper mb-4">
              ROADMAP · {sel.roadmap.phases.length} FASES
            </div>
            {sel.roadmap.phases.map((ph, i) => (
              <div key={i} className="flex gap-3 mb-3.5">
                <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-aion-accent to-aion-cyan
                                flex items-center justify-center text-[11px] font-black flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold mb-[5px]">
                    {ph.name}{" "}
                    <span className="text-aion-muted font-normal text-[11px]">
                      ({ph.duration})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(ph.tasks || []).map((t, j) => (
                      <span
                        key={j}
                        className="text-[11px] bg-white/[0.03] border border-aion-border
                                   px-2 py-0.5 rounded-[5px] text-slate-500"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KPIs & Stack */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {sel.roadmap?.kpis?.length > 0 && (
            <div className="glass p-3.5">
              <div className="label-upper mb-2.5">KPIs</div>
              {sel.roadmap.kpis.map((k, i) => (
                <div key={i} className="text-xs text-slate-400 py-1 border-b border-aion-border">
                  📊 {k}
                </div>
              ))}
            </div>
          )}
          {sel.roadmap?.stack?.length > 0 && (
            <div className="glass p-3.5">
              <div className="label-upper mb-2.5">TECH STACK</div>
              {sel.roadmap.stack.map((t, i) => (
                <div key={i} className="text-xs text-slate-400 py-1 border-b border-aion-border">
                  ⚙️ {t}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risks */}
        {sel.roadmap?.risks?.length > 0 && (
          <div className="glass p-3.5 mb-3 border-red-500/[0.12]">
            <div className="label-upper mb-2.5 !text-aion-red">⚠️ RIESGOS</div>
            {sel.roadmap.risks.map((r, i) => (
              <div key={i} className="text-xs text-slate-400 py-1 border-b border-aion-border">
                {r}
              </div>
            ))}
          </div>
        )}

        {/* Orchestration */}
        <div className="glass p-[18px]">
          <div className="label-upper mb-3.5">🔗 ORQUESTAR INTEGRACIONES</div>
          <div className="grid grid-cols-2 gap-2">
            {ORCHESTRATIONS.map((o) => {
              const done = sel.integrations?.[o.name]?.done;
              const busy = orchLoading === o.name;
              return (
                <button
                  key={o.name}
                  onClick={() => orchestrate(sel, o.name)}
                  disabled={busy}
                  className={`glass p-3 text-left transition-all cursor-pointer ${
                    done ? "border-emerald-500/[0.15]" : ""
                  } ${busy ? "cursor-wait" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[18px]">{o.icon}</span>
                    <div>
                      <div className={`text-xs font-bold ${done ? "text-aion-green" : "text-aion-text"}`}>
                        {busy ? "⏳ Ejecutando..." : o.label}
                      </div>
                      {done && (
                        <div className="text-[10px] text-aion-green mt-px">
                          ✓ {sel.integrations[o.name].ts}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );

  // ── LIST VIEW ────────────────────────────────────────────
  return (
    <div className="p-5 max-w-[780px] mx-auto">
      <div className="flex items-center justify-between mb-[22px]">
        <div>
          <h1 className="text-[19px] font-black tracking-tight mb-[3px]">
            🚀 Project Intelligence
          </h1>
          <p className="text-aion-muted text-[11px]">
            IA genera roadmap + KPIs + stack en segundos.
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          className="btn-primary text-xs px-3.5 py-2"
        >
          + Nuevo
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="glass p-11 text-center">
          <div className="text-[44px] mb-3.5">🚀</div>
          <div className="text-[15px] font-extrabold mb-1.5">Sin proyectos aún</div>
          <div className="text-slate-800 text-xs mb-[18px] max-w-[280px] mx-auto">
            La IA genera roadmap completo, KPIs, tech stack y análisis de riesgos automáticamente.
          </div>
          <button onClick={() => setView("create")} className="btn-primary">
            Crear Primer Proyecto
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setSel(p);
                setView("detail");
                navigate(`/projects/${p.id}`);
              }}
              className="glass p-4 cursor-pointer flex items-center justify-between
                         transition-all hover:border-aion-accent/25"
            >
              <div>
                <div className="text-sm font-bold mb-[5px]">{p.name}</div>
                <div className="flex gap-1.5 items-center">
                  <span className="tag bg-aion-accent/10 text-aion-accent border border-aion-accent/20">
                    {p.type}
                  </span>
                  <span className="text-[10px] text-slate-800">
                    {p.roadmap?.phases?.length || 0} fases ·{" "}
                    {Object.keys(p.integrations || {}).length} integración
                    {Object.keys(p.integrations || {}).length !== 1 ? "es" : ""}
                  </span>
                </div>
              </div>
              <span className="text-slate-800 text-base">→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
