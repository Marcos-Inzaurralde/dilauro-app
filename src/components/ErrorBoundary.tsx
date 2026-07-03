// ─────────────────────────────────────────────────────────────
// AION — Error Boundary (Tailwind)
// ─────────────────────────────────────────────────────────────
import { Component, type ReactNode, type ErrorInfo } from "react";

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

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AION Error Boundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-aion-bg text-aion-text font-sans">
          <div className="text-center max-w-md px-5">
            <div className="text-5xl mb-4">💥</div>
            <h1 className="text-2xl font-black mb-2">Algo salió mal</h1>
            <p className="text-sm text-aion-muted mb-5">
              {this.state.error?.message || "Error inesperado."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Recargar AION
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
