// ─────────────────────────────────────────────────────────────
// AION — Toast Notification System (Tailwind)
// ─────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import type { Toast } from "../types";

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: Toast["type"] = "info", duration = 4000) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        duration
      );
    },
    []
  );

  function ToastContainer() {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-[340px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              px-4 py-3 rounded-[10px] text-[13px] font-medium text-white
              backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)]
              animate-slide-in leading-relaxed
              ${t.type === "error"
                ? "bg-red-500/60 border border-red-500/25"
                : t.type === "success"
                  ? "bg-emerald-500/60 border border-emerald-500/25"
                  : "bg-slate-700 border border-slate-600"
              }
            `}
          >
            {t.type === "error" ? "⚠️ " : t.type === "success" ? "✓ " : "ℹ️ "}
            {t.message}
          </div>
        ))}
      </div>
    );
  }

  return { addToast, ToastContainer };
}
