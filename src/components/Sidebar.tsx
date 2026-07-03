// ─────────────────────────────────────────────────────────────
// AION — Sidebar Navigation (Tailwind + React Router)
// ─────────────────────────────────────────────────────────────
import { NAV } from "../config/constants";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  active: string;
  onSelect: (path: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobile: boolean;
}

export function Sidebar({
  active,
  onSelect,
  collapsed,
  setCollapsed,
  mobile,
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const sidebarWidth = collapsed
    ? mobile ? "w-0" : "w-[58px]"
    : mobile ? "w-[244px]" : "w-[224px]";

  return (
    <>
      {/* Mobile backdrop */}
      {mobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 bg-black/65 z-40"
        />
      )}

      <div
        className={`
          ${sidebarWidth}
          ${mobile ? "fixed left-0 top-0 bottom-0 z-50 h-screen" : "relative"}
          bg-[rgba(5,5,14,0.85)] backdrop-blur-xl border-r border-aion-border
          flex flex-col flex-shrink-0 transition-all duration-[220ms] ease-out overflow-hidden
        `}
      >
        {/* Logo */}
        <div
          className={`
            ${collapsed && !mobile ? "py-[18px] px-0 justify-center" : "pt-5 px-4 pb-4 justify-between"}
            border-b border-aion-border flex items-center
          `}
        >
          {(!collapsed || mobile) && (
            <div>
              <div className="text-[19px] font-black bg-gradient-to-br from-aion-accent to-aion-cyan bg-clip-text text-transparent tracking-tight">
                AION
              </div>
              <div className="text-[7px] text-slate-800 mt-px tracking-[3.5px] font-bold">
                AI BUSINESS OS
              </div>
            </div>
          )}
          {collapsed && !mobile && (
            <div className="text-[18px] font-black bg-gradient-to-br from-aion-accent to-aion-cyan bg-clip-text text-transparent">
              ⚡
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="bg-white/[0.04] border border-aion-border rounded-[7px] w-7 h-7
                       cursor-pointer text-slate-600 text-[13px] flex items-center
                       justify-center flex-shrink-0 hover:bg-white/[0.08] transition-colors"
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Nav items */}
        <nav className={`flex-1 ${collapsed && !mobile ? "px-[5px]" : "px-[7px]"} py-2.5 overflow-y-auto`}>
          {NAV.map((n) => {
            const isActive = active === n.id;
            return (
              <button
                key={n.id}
                onClick={() => onSelect(n.path)}
                title={n.label}
                className={`
                  flex items-center gap-2.5 w-full mb-[3px] rounded-[9px]
                  cursor-pointer text-[13px] text-left transition-all duration-150
                  ${collapsed && !mobile ? "py-[11px] px-0 justify-center" : "py-[9px] px-[11px] justify-start"}
                  ${isActive
                    ? "bg-aion-accent-lo border border-purple-500/[0.28] text-purple-400 font-bold"
                    : "bg-transparent border border-transparent text-aion-muted font-normal hover:bg-white/[0.03]"
                  }
                `}
              >
                <span className="text-[15px] flex-shrink-0">{n.icon}</span>
                {(!collapsed || mobile) && <span>{n.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer — User info + Logout */}
        {(!collapsed || mobile) && (
          <div className="px-4 py-3 border-t border-aion-border">
            {/* User row */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-aion-accent to-aion-cyan
                              flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="text-xs font-semibold text-aion-text truncate">
                  {displayName}
                </div>
                <div className="text-[9px] text-slate-800 truncate">
                  {user?.email || ""}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut()}
              className="w-full bg-red-500/[0.08] border border-red-500/[0.15] rounded-[7px]
                         py-1.5 text-red-500 text-[11px] font-semibold cursor-pointer
                         font-sans transition-all hover:bg-red-500/[0.15] mb-2"
            >
              Cerrar Sesión
            </button>

            {/* Status + version */}
            <div className="flex items-center gap-[5px] mb-[3px]">
              <div className="w-[5px] h-[5px] rounded-full bg-aion-green shadow-[0_0_6px_#10B981]" />
              <div className="text-[9px] text-slate-800 font-semibold tracking-[1px]">
                PROXY ACTIVO
              </div>
            </div>
            <div className="text-[8px] text-slate-900 tracking-[0.5px]">
              AION v4.0 · INZATECH © 2026
            </div>
          </div>
        )}
      </div>
    </>
  );
}
