// ─────────────────────────────────────────────────────────────
// AION — Error Boundary
// ─────────────────────────────────────────────────────────────
// Catches React rendering errors so a broken module doesn't
// take down the entire app. Shows a recovery UI instead.
// ─────────────────────────────────────────────────────────────
import { Component, type ReactNode, type ErrorInfo } from "react";
import { T } from "../config/theme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console for debugging — could send to a service later
    console.error("[AION] Error caught by boundary:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: T.bg,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 440,
              textAlign: "center",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "48px 32px",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: T.text,
                margin: "0 0 8px",
                letterSpacing: "-0.3px",
              }}
            >
              Algo salió mal
            </h2>
            <p
              style={{
                fontSize: 13,
                color: T.muted,
                margin: "0 0 20px",
                lineHeight: 1.6,
              }}
            >
              Ocurrió un error inesperado. Puedes intentar recargar el módulo o
              volver al inicio.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 20,
                  fontSize: 11,
                  color: "#EF4444",
                  fontFamily: "monospace",
                  textAlign: "left",
                  wordBreak: "break-word",
                  maxHeight: 80,
                  overflow: "auto",
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 20px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  color: T.muted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
