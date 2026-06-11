// ─────────────────────────────────────────────────────────────
// AION — Auth Page (Login / Register / Reset Password)
// ─────────────────────────────────────────────────────────────
import { useState, type FormEvent, type CSSProperties } from "react";
import { useAuth } from "../contexts/AuthContext";
import { T, inp, GLOBAL_KEYFRAMES } from "../config/theme";
import { isSupabaseConfigured } from "../config/supabase";

type View = "login" | "register" | "reset";

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  // If Supabase isn't configured yet, show setup message
  if (!isSupabaseConfigured) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Logo />
          <div style={{ ...msgBox("#F59E0B"), marginTop: 16 }}>
            ⚙️ Autenticación no configurada todavía. Setea{" "}
            <code>VITE_SUPABASE_URL</code> y{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> en Vercel.
          </div>
        </div>
        <style>{GLOBAL_KEYFRAMES}</style>
      </div>
    );
  }

  const reset = () => {
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    setBusy(true);

    try {
      if (view === "login") {
        const { error: err } = await signIn(email, password);
        if (err) setError(err);
      } else if (view === "register") {
        const { error: err, needsConfirmation } = await signUp(
          email,
          password,
          name || undefined
        );
        if (err) {
          setError(err);
        } else if (needsConfirmation) {
          setInfo(
            "📧 ¡Registro exitoso! Revisa tu email para confirmar tu cuenta."
          );
          setView("login");
        }
      } else if (view === "reset") {
        const { error: err } = await resetPassword(email);
        if (err) {
          setError(err);
        } else {
          setInfo("📧 Revisa tu email para restablecer tu contraseña.");
          setView("login");
        }
      }
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const switchView = (v: View) => {
    reset();
    setView(v);
  };

  return (
    <div style={pageStyle}>
      {/* Ambient glow */}
      <div style={glowStyle} />

      <div style={cardStyle}>
        <Logo />

        <h2 style={titleStyle}>
          {view === "login"
            ? "Iniciar Sesión"
            : view === "register"
            ? "Crear Cuenta"
            : "Restablecer Contraseña"}
        </h2>

        <p style={subtitleStyle}>
          {view === "login"
            ? "Accede a tu sistema operativo de negocios"
            : view === "register"
            ? "Comienza a operar con inteligencia artificial"
            : "Te enviaremos un link para restablecer tu contraseña"}
        </p>

        {error && <div style={msgBox(T.red)}>❌ {error}</div>}
        {info && <div style={msgBox(T.green)}>✅ {info}</div>}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {view === "register" && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                style={inp}
              />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={inp}
              autoComplete="email"
            />
          </div>

          {view !== "reset" && (
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={inp}
                autoComplete={
                  view === "login" ? "current-password" : "new-password"
                }
              />
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              ...submitBtnStyle,
              opacity: busy ? 0.6 : 1,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy
              ? "⏳ Procesando..."
              : view === "login"
              ? "Entrar →"
              : view === "register"
              ? "Crear Cuenta →"
              : "Enviar Link →"}
          </button>
        </form>

        {/* Footer links */}
        <div style={footerStyle}>
          {view === "login" && (
            <>
              <button
                onClick={() => switchView("reset")}
                style={linkBtnStyle}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <span style={{ color: T.muted }}>·</span>
              <button
                onClick={() => switchView("register")}
                style={linkBtnStyle}
              >
                Crear cuenta
              </button>
            </>
          )}
          {view === "register" && (
            <>
              <span style={{ color: T.muted, fontSize: 13 }}>
                ¿Ya tenés cuenta?
              </span>
              <button
                onClick={() => switchView("login")}
                style={linkBtnStyle}
              >
                Iniciar sesión
              </button>
            </>
          )}
          {view === "reset" && (
            <button onClick={() => switchView("login")} style={linkBtnStyle}>
              ← Volver al login
            </button>
          )}
        </div>
      </div>

      <style>{GLOBAL_KEYFRAMES}</style>
    </div>
  );
}

/* ── Sub-components ── */

function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
          background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-1px",
        }}
      >
        AION
      </div>
      <div
        style={{
          fontSize: 9,
          color: "#334155",
          letterSpacing: 4,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        AI BUSINESS OS
      </div>
    </div>
  );
}

/* ── Styles ── */

const pageStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  background: T.bg,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  padding: 16,
  position: "relative",
  overflow: "hidden",
};

const glowStyle: CSSProperties = {
  position: "absolute",
  width: 500,
  height: 500,
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.06) 40%, transparent 70%)",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  pointerEvents: "none",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 400,
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(20px)",
  border: `1px solid ${T.border}`,
  borderRadius: 20,
  padding: "40px 32px",
  position: "relative",
  zIndex: 1,
};

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: T.text,
  textAlign: "center",
  margin: "0 0 6px",
  letterSpacing: "-0.3px",
};

const subtitleStyle: CSSProperties = {
  fontSize: 13,
  color: T.muted,
  textAlign: "center",
  margin: "0 0 24px",
  lineHeight: 1.5,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: T.muted,
  marginBottom: 6,
  letterSpacing: "0.3px",
};

const submitBtnStyle: CSSProperties = {
  width: "100%",
  padding: "12px 0",
  background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "inherit",
  transition: "all 0.2s ease",
};

const footerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  marginTop: 20,
  flexWrap: "wrap",
};

const linkBtnStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "#7C3AED",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: 0,
};

const msgBox = (color: string): CSSProperties => ({
  background: `${color}12`,
  border: `1px solid ${color}30`,
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  color: T.text,
  marginBottom: 16,
  lineHeight: 1.5,
});
