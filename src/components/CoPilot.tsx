// ─────────────────────────────────────────────────────────────
// AION — AI Co-Pilot with Real Streaming (Tailwind)
// ─────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import type { ChatHistory, ModeName } from "../types";
import { MODES, MODE_SUGGESTIONS } from "../config/constants";
import { callAIStream } from "../config/api";

interface CoPilotProps {
  chatHistory: ChatHistory;
  saveChats: (chats: ChatHistory) => void;
  addToast: (msg: string, type?: "info" | "success" | "error") => void;
}

const modeColors: Record<ModeName, string> = {
  strategy: "#8B5CF6",
  development: "#06B6D4",
  marketing: "#F59E0B",
  monetization: "#10B981",
  planning: "#3B82F6",
  creation: "#EC4899",
};

export function CoPilot({ chatHistory, saveChats, addToast }: CoPilotProps) {
  const [mode, setMode] = useState<ModeName>("strategy");
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const msgs = chatHistory[mode] || [];
  const m = MODES[mode];
  const color = modeColors[mode];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading, streaming]);

  const setMsgs = (newMsgs: typeof msgs) => {
    saveChats({ ...chatHistory, [mode]: newMsgs });
  };

  const send = async () => {
    if (!inputVal.trim() || loading) return;
    const userMsg = { role: "user" as const, content: inputVal.trim() };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInputVal("");
    setLoading(true);
    setStreaming("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const fullReply = await callAIStream(
        newMsgs,
        m.prompt,
        m.maxTokens,
        (text) => setStreaming(text),
        controller.signal
      );

      setStreaming("");
      setMsgs([...newMsgs, { role: "assistant", content: fullReply }]);
    } catch (e) {
      const err = e as Error;
      if (err.name === "AbortError") {
        if (streaming) {
          setMsgs([
            ...newMsgs,
            { role: "assistant", content: streaming + "\n\n_(cancelado)_" },
          ]);
        }
        addToast("Respuesta cancelada", "info");
      } else {
        addToast(err.message, "error");
        setMsgs([
          ...newMsgs,
          { role: "assistant", content: `⚠️ Error: ${err.message}` },
        ]);
      }
    }

    setStreaming("");
    setLoading(false);
    abortRef.current = null;
    inputRef.current?.focus();
  };

  const cancelStream = () => {
    abortRef.current?.abort();
  };

  const clearHistory = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setMsgs([]);
    setConfirmClear(false);
    addToast("Historial borrado", "info");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] p-4 gap-3 box-border">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[19px] font-black tracking-tight mb-0.5">
            🧠 AI Co-Pilot
          </h1>
          <p className="text-aion-muted text-[11px]">
            6 modos especializados · Streaming real · max {m.maxTokens} tokens/respuesta
          </p>
        </div>
        <button
          onClick={clearHistory}
          className={`btn-outline text-[11px] px-[11px] py-[5px] ${
            confirmClear
              ? "border-aion-red text-aion-red"
              : "border-slate-600 text-slate-600 hover:text-slate-400"
          }`}
        >
          {confirmClear ? "¿Seguro? Click de nuevo" : "Limpiar"}
        </button>
      </div>

      {/* Mode selector */}
      <div className="flex gap-[5px] flex-wrap flex-shrink-0">
        {(Object.entries(MODES) as [ModeName, typeof m][]).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className="px-3 py-[5px] rounded-full text-[11px] font-bold cursor-pointer transition-all duration-150"
            style={{
              background: mode === k ? v.color : "transparent",
              border: `1px solid ${mode === k ? v.color : "rgba(255,255,255,0.07)"}`,
              color: mode === k ? "#fff" : "#475569",
            }}
          >
            {v.emoji} {v.label}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1 glass p-4 overflow-y-auto flex flex-col gap-3 min-h-0">
        {/* Empty state with suggestions */}
        {msgs.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full flex-col gap-2.5">
            <div className="text-[42px]">{m.emoji}</div>
            <div className="text-sm font-extrabold" style={{ color }}>
              {m.label}
            </div>
            <div className="text-[11px] text-slate-800 text-center max-w-[220px] leading-relaxed">
              Modo activo con streaming real y hasta {m.maxTokens.toLocaleString()} tokens por respuesta.
            </div>
            <div className="flex flex-col gap-[5px] mt-2 w-full max-w-[340px]">
              {MODE_SUGGESTIONS[mode]?.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInputVal(s)}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-lg
                             px-3 py-[7px] cursor-pointer text-slate-600 text-[11px]
                             text-left transition-all hover:text-slate-400"
                >
                  💡 {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {msgs.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[86%] px-3.5 py-2.5 text-[13px] leading-[1.7] whitespace-pre-wrap text-slate-300"
              style={{
                background:
                  msg.role === "user"
                    ? `${color}14`
                    : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  msg.role === "user"
                    ? color + "28"
                    : "rgba(255,255,255,0.06)"
                }`,
                borderRadius:
                  msg.role === "user"
                    ? "14px 14px 4px 14px"
                    : "14px 14px 14px 4px",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streaming && (
          <div className="flex">
            <div className="max-w-[86%] px-3.5 py-2.5 text-[13px] leading-[1.7]
                            whitespace-pre-wrap text-slate-300 bg-white/[0.03]
                            border border-white/[0.06] rounded-[14px_14px_14px_4px]">
              {streaming}
              <span className="opacity-50 animate-blink">▋</span>
            </div>
          </div>
        )}

        {/* Loading dots */}
        {loading && !streaming && (
          <div className="flex">
            <div className="glass px-4 py-2.5 rounded-[14px_14px_14px_4px]">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-dot"
                    style={{
                      background: color,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={`Modo ${m.label} · Enter para enviar`}
          className="input-base flex-1"
          disabled={loading}
        />
        {loading ? (
          <button
            onClick={cancelStream}
            className="btn-primary bg-aion-red border-aion-red min-w-[68px]"
          >
            ■
          </button>
        ) : (
          <button
            onClick={send}
            disabled={!inputVal.trim()}
            className="btn-primary min-w-[68px] disabled:opacity-40"
            style={{ background: color, borderColor: color }}
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}
