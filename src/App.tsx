// ─────────────────────────────────────────────────────────────
// AION AI Business OS v3.1 — Root Component
// ─────────────────────────────────────────────────────────────
// ✅ Modular architecture (13+ files)
// ✅ Full TypeScript types
// ✅ Real streaming via Vercel Edge Function proxy
// ✅ Persistent state via localStorage
// ✅ Supabase Auth (login/register/reset)
// ✅ Error Boundary for crash recovery
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import type { Project, ChatHistory } from "./types";
import { T, GLOBAL_KEYFRAMES } from "./config/theme";
import { usePersistedState } from "./hooks/useStorage";
import { useToast } from "./hooks/useToast";
import { useMobile } from "./hooks/useMobile";
import { useAuth } from "./contexts/AuthContext";

import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./components/Dashboard";
import { CoPilot } from "./components/CoPilot";
import { Projects } from "./components/Projects";
import { StrategyRoom } from "./components/StrategyRoom";
import { IntegrationsHub } from "./components/IntegrationsHub";
import { AuthPage } from "./pages/AuthPage";

export default function App() {
  const { user, loading } = useAuth();
  const [mod, setMod] = useState("dashboard");
  const [projects, setProjects] = usePersistedState<Project[]>(
    "projects",
    []
  );
  const [chats, setChats] = usePersistedState<ChatHistory>("chats", {});
  const [collapsed, setCollapsed] = useState(false);
  const mobile = useMobile();
  const { addToast, ToastContainer } = useToast();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (mobile) setCollapsed(true);
  }, [mobile]);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: T.bg,
          color: T.text,
          fontFamily: "'DM Sans',system-ui,sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              background: "linear-gradient(135deg,#7C3AED,#06B6D4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AION
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: T.muted,
              animation: "blink 1.2s infinite",
            }}
          >
            Cargando...
          </div>
          <style>{GLOBAL_KEYFRAMES}</style>
        </div>
      </div>
    );
  }

  // Not authenticated → show auth page
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated → show the app
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: T.bg,
        color: T.text,
        fontFamily: "'DM Sans',system-ui,sans-serif",
        overflow: "hidden",
      }}
    >
      {mobile && (
        <TopBar onMenuOpen={() => setCollapsed(false)} mod={mod} />
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          active={mod}
          onSelect={setMod}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobile={mobile}
        />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {mod === "dashboard" && (
            <Dashboard projects={projects} onNavigate={setMod} />
          )}
          {mod === "copilot" && (
            <CoPilot
              chatHistory={chats}
              saveChats={setChats}
              addToast={addToast}
            />
          )}
          {mod === "projects" && (
            <Projects
              projects={projects}
              saveProjects={setProjects}
              addToast={addToast}
            />
          )}
          {mod === "strategy" && <StrategyRoom addToast={addToast} />}
          {mod === "integrations" && (
            <IntegrationsHub addToast={addToast} />
          )}
        </div>
      </div>

      <ToastContainer />
      <style>{GLOBAL_KEYFRAMES}</style>
    </div>
  );
}
