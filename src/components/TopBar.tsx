// ─────────────────────────────────────────────────────────────
// AION — Mobile Top Bar (Tailwind)
// ─────────────────────────────────────────────────────────────
import { NAV } from "../config/constants";

interface TopBarProps {
  onMenuOpen: () => void;
  mod: string;
}

export function TopBar({ onMenuOpen, mod }: TopBarProps) {
  const label = NAV.find((n) => n.id === mod)?.label || "";

  return (
    <div className="sticky top-0 z-30 bg-[rgba(7,7,16,0.92)] backdrop-blur-[14px]
                    border-b border-aion-border px-4 py-3 flex items-center gap-3">
      <button
        onClick={onMenuOpen}
        className="bg-white/[0.04] border border-aion-border rounded-lg w-[34px] h-[34px]
                   cursor-pointer text-slate-400 text-[17px] flex items-center justify-center"
      >
        ☰
      </button>
      <div className="text-[15px] font-black bg-gradient-to-br from-aion-accent to-aion-cyan
                      bg-clip-text text-transparent">
        AION
      </div>
      <div className="text-xs text-slate-800 ml-0.5">· {label}</div>
    </div>
  );
}
