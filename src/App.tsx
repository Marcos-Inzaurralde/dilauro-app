// ─────────────────────────────────────────────────────────────
// AION AI Business OS v6.0 — Root Component
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import type { Project, ChatHistory } from "./types";
import { usePersistedState } from "./hooks/useStorage";
import { useToast } from "./hooks/useToast";
import { useMobile } from "./hooks/useMobile";
import { useAuth } from "./contexts/AuthContext";
import {
  fetchProjects,
  upsertProject,
  deleteProject as dbDeleteProject,
  fetchChats,
  saveChat,
  checkTablesExist,
  fetchStrategyCount,
} from "./lib/db";
import { trackEvent } from "./lib/analytics";

import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./components/Dashboard";
import { CoPilot } from "./components/CoPilot";
import { Projects } from "./components/Projects";
import { StrategyRoom } from "./components/StrategyRoom";
import { IntegrationsHub } from "./components/IntegrationsHub";
import { SettingsPage } from "./pages/SettingsPage";
import { PricingPage } from "./pages/PricingPage";
import { TeamPage } from "./pages/TeamPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AuthPage } from "./pages/AuthPage";

export default function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjectsLocal] = usePersistedState<Project[]>("projects", []);
  const [chats, setChatsLocal] = usePersistedState<ChatHistory>("chats", {});
  const [collapsed, setCollapsed] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [strategyCount, setStrategyCount] = useState(0);
  const [currentPlan, setCurrentPlan] = useState("free");
  const mobile = useMobile();
  const { addToast, ToastContainer } = useToast();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (mobile) setCollapsed(true);
  }, [mobile]);

  // Load data from Supabase on auth
  useEffect(() => {
    if (!user) return;
    (async () => {
      const ready = await checkTablesExist();
      setDbReady(ready);
      if (!ready) return;

      const [dbProjects, dbChats, dbStratCount] = await Promise.all([
        fetchProjects(),
        fetchChats(),
        fetchStrategyCount(),
      ]);
      if (dbProjects.length > 0) setProjectsLocal(dbProjects);
      if (Object.keys(dbChats).length > 0) setChatsLocal(dbChats);
      setStrategyCount(dbStratCount);

      // Track session start
      trackEvent("session_start", { userId: user.id });
    })();
  }, [user]);

  // Check for checkout success
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("checkout") === "success") {
      addToast("¡Suscripción activada! 🎉", "success");
      navigate(location.pathname, { replace: true });
    }
  }, [location]);

  // Project handlers with Supabase sync
  const setProjects = useCallback(
    (newProjects: Project[]) => {
      setProjectsLocal(newProjects);
      if (dbReady && user) {
        for (const p of newProjects) {
          upsertProject(p, user.id);
        }
      }
    },
    [dbReady, user, setProjectsLocal]
  );

  const removeProject = useCallback(
    (id: string) => {
      setProjectsLocal((prev) => prev.filter((p) => p.id !== id));
      if (dbReady) dbDeleteProject(id);
      trackEvent("project_deleted", { projectId: id });
    },
    [dbReady, setProjectsLocal]
  );

  // Chat handlers with Supabase sync
  const setChats = useCallback(
    (newChats: ChatHistory) => {
      setChatsLocal(newChats);
      if (dbReady && user) {
        for (const [mode, messages] of Object.entries(newChats)) {
          saveChat(mode, messages, user.id);
        }
      }
    },
    [dbReady, user, setChatsLocal]
  );

  const clearAllChats = useCallback(() => {
    setChatsLocal({});
    trackEvent("chats_cleared");
  }, [setChatsLocal]);

  const clearAllProjects = useCallback(() => {
    setProjectsLocal([]);
    trackEvent("projects_cleared");
  }, [setProjectsLocal]);

  // Total message count
  const totalMessages = Object.values(chats).reduce((sum, msgs) => sum + msgs.length, 0);

  // Derive active module from path
  const pathToMod: Record<string, string> = {
    "/": "dashboard",
    "/copilot": "copilot",
    "/projects": "projects",
    "/strategy": "strategy",
    "/integrations": "integrations",
    "/analytics": "analytics",
    "/team": "team",
    "/pricing": "pricing",
    "/settings": "settings",
  };
  const mod = pathToMod[location.pathname] || "dashboard";

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-aion-bg text-aion-text font-sans">
        <div className="text-center">
          <div className="text-[32px] font-black bg-gradient-to-br from-aion-accent to-aion-cyan bg-clip-text text-transparent">
            AION
          </div>
          <div className="mt-3 text-[13px] text-aion-muted animate-blink">
            Cargando...
          </div>
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
    <div className="flex flex-col h-screen bg-aion-bg text-aion-text font-sans overflow-hidden">
      {mobile && (
        <TopBar onMenuOpen={() => setCollapsed(false)} mod={mod} />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          active={mod}
          onSelect={(path: string) => {
            navigate(path);
            if (mobile) setCollapsed(true);
          }}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobile={mobile}
        />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  projects={projects}
                  chatHistory={chats}
                  strategyCount={strategyCount}
                  onNavigate={(path: string) => navigate(path)}
                />
              }
            />
            <Route
              path="/copilot"
              element={
                <CoPilot
                  chatHistory={chats}
                  saveChats={setChats}
                  addToast={addToast}
                  projects={projects}
                />
              }
            />
            <Route
              path="/projects"
              element={
                <Projects
                  projects={projects}
                  saveProjects={setProjects}
                  removeProject={removeProject}
                  addToast={addToast}
                />
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <Projects
                  projects={projects}
                  saveProjects={setProjects}
                  removeProject={removeProject}
                  addToast={addToast}
                />
              }
            />
            <Route
              path="/strategy"
              element={<StrategyRoom addToast={addToast} projects={projects} />}
            />
            <Route
              path="/integrations"
              element={<IntegrationsHub addToast={addToast} />}
            />
            <Route
              path="/analytics"
              element={
                <AnalyticsPage
                  chatHistory={chats}
                  projects={projects}
                  strategyCount={strategyCount}
                />
              }
            />
            <Route
              path="/team"
              element={<TeamPage addToast={addToast} />}
            />
            <Route
              path="/pricing"
              element={
                <PricingPage
                  addToast={addToast}
                  currentPlan={currentPlan}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  addToast={addToast}
                  onClearChats={clearAllChats}
                  onClearProjects={clearAllProjects}
                  totalMessages={totalMessages}
                  totalProjects={projects.length}
                  totalStrategies={strategyCount}
                />
              }
            />
          </Routes>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
