// ─────────────────────────────────────────────────────────────
// AION — Auth Page (Tailwind) — Login / Register / Reset
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

type AuthMode = "login" | "register" | "reset";

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) setMessage({ text: error, type: "error" });
      } else if (mode === "register") {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setMessage({ text: error, type: "error" });
        } else {
          setMessage({
            text: "✓ Cuenta creada. Ya podés iniciar sesión.",
            type: "success",
          });
          setMode("login");
        }
      } else {
        const { error } = await resetPassword(email);
        if (error) {
          setMessage({ text: error, type: "error" });
        } else {
          setMessage({
            text: "Revisá tu email para restablecer la contraseña.",
            type: "success",
          });
        }
      }
    } catch (e) {
      setMessage({ text: (e as Error).message, type: "error" });
    }
    setLoading(false);
  };

  const titles: Record<AuthMode, string> = {
    login: "Iniciar Sesión",
    register: "Crear Cuenta",
    reset: "Recuperar Contraseña",
  };

  return (
    <div className="flex items-center justify-center h-screen bg-aion-bg font-sans px-5">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[32px] font-black bg-gradient-to-br from-aion-accent to-aion-cyan bg-clip-text text-transparent tracking-tight">
            AION
          </div>
          <div className="text-[8px] text-slate-800 mt-px tracking-[4px] font-bold">
            AI BUSINESS OS
          </div>
        </div>

        {/* Card */}
        <div className="glass p-6">
          <h2 className="text-base font-extrabold text-aion-text mb-4 text-center">
            {titles[mode]}
          </h2>

          {/* Message */}
          {message && (
            <div
              className={`text-xs px-3.5 py-2.5 rounded-[10px] mb-3 font-medium ${
                message.type === "error"
                  ? "bg-red-500/10 border border-red-500/20 text-aion-red"
                  : "bg-emerald-500/10 border border-emerald-500/20 text-aion-green"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {mode === "register" && (
              <div>
                <label className="label-upper">NOMBRE</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  className="input-base mt-1"
                />
              </div>
            )}

            <div>
              <label className="label-upper">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                placeholder="tu@email.com"
                className="input-base mt-1"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <label className="label-upper">CONTRASEÑA</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handle()}
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : "••••••••"}
                  className="input-base mt-1"
                />
              </div>
            )}

            <button
              onClick={handle}
              disabled={loading}
              className="btn-primary py-[10px] mt-1 text-[13px]"
            >
              {loading
                ? "⏳ Espera..."
                : mode === "login"
                  ? "Entrar"
                  : mode === "register"
                    ? "Crear Cuenta"
                    : "Enviar Email"}
            </button>
          </div>

          {/* Switch mode links */}
          <div className="mt-4 text-center flex flex-col gap-[5px]">
            {mode === "login" && (
              <>
                <button
                  onClick={() => { setMode("register"); setMessage(null); }}
                  className="bg-transparent border-none text-aion-muted text-[11px]
                             cursor-pointer hover:text-slate-400"
                >
                  ¿No tenés cuenta? <span className="font-bold text-aion-accent">Crear una</span>
                </button>
                <button
                  onClick={() => { setMode("reset"); setMessage(null); }}
                  className="bg-transparent border-none text-aion-muted text-[11px]
                             cursor-pointer hover:text-slate-400"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            )}
            {mode !== "login" && (
              <button
                onClick={() => { setMode("login"); setMessage(null); }}
                className="bg-transparent border-none text-aion-muted text-[11px]
                           cursor-pointer hover:text-slate-400"
              >
                ← Volver al login
              </button>
            )}
          </div>
        </div>

        <div className="text-center text-[8px] text-slate-900 mt-4 tracking-[0.5px]">
          AION v4.0 · INZATECH © 2026
        </div>
      </div>
    </div>
  );
}
