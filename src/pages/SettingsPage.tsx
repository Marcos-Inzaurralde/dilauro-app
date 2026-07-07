// ─────────────────────────────────────────────────────────────
// AION — Settings Page (Tailwind)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "../config/supabase";
import type { ModeName } from "../types";
import { MODES } from "../config/constants";

interface SettingsPageProps {
  addToast: (msg: string, type?: "info" | "success" | "error") => void;
  onClearChats: () => void;
  onClearProjects: () => void;
  totalMessages: number;
  totalProjects: number;
  totalStrategies: number;
}

interface Profile {
  display_name: string;
  default_mode: ModeName;
}

export function SettingsPage({
  addToast,
  onClearChats,
  onClearProjects,
  totalMessages,
  totalProjects,
  totalStrategies,
}: SettingsPageProps) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    display_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "",
    default_mode: "strategy" as ModeName,
  });
  const [saving, setSaving] = useState(false);
  const [confirmClearChats, setConfirmClearChats] = useState(false);
  const [confirmClearProjects, setConfirmClearProjects] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load profile from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            display_name: data.display_name || profile.display_name,
            default_mode: (data.preferences as Record<string, string>)?.default_mode as ModeName || "strategy",
          });
        }
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update Supabase Auth metadata
      await supabase.auth.updateUser({
        data: { full_name: profile.display_name },
      });

      // Upsert profile table
      if (isSupabaseConfigured) {
        await supabase.from("profiles").upsert({
          id: user.id,
          display_name: profile.display_name,
          preferences: { default_mode: profile.default_mode },
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
      }

      addToast("Perfil guardado", "success");
    } catch {
      addToast("Error al guardar perfil", "error");
    }
    setSaving(false);
  };

  const handleClearChats = () => {
    if (!confirmClearChats) {
      setConfirmClearChats(true);
      setTimeout(() => setConfirmClearChats(false), 3000);
      return;
    }
    onClearChats();
    setConfirmClearChats(false);
    addToast("Historial de chats eliminado", "info");
  };

  const handleClearProjects = () => {
    if (!confirmClearProjects) {
      setConfirmClearProjects(true);
      setTimeout(() => setConfirmClearProjects(false), 3000);
      return;
    }
    onClearProjects();
    setConfirmClearProjects(false);
    addToast("Proyectos eliminados", "info");
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 5000);
      return;
    }
    // Just sign out — actual deletion needs admin
    await signOut();
    addToast("Sesión cerrada", "info");
  };

  const initial = profile.display_name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="p-5 max-w-[640px] mx-auto">
      <h1 className="text-[19px] font-black tracking-tight mb-[3px]">
        ⚙️ Configuración
      </h1>
      <p className="text-aion-muted text-[11px] mb-6">
        Perfil, preferencias y gestión de datos.
      </p>

      {/* Profile Section */}
      <div className="glass p-5 mb-4">
        <div className="label-upper mb-4">PERFIL</div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-aion-accent to-aion-cyan
                          flex items-center justify-center text-xl font-black text-white flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{profile.display_name || "Sin nombre"}</div>
            <div className="text-[11px] text-aion-muted truncate">{user?.email}</div>
            <div className="text-[10px] text-aion-green mt-0.5 font-semibold">Plan Free</div>
          </div>
        </div>

        <label className="label-upper block mb-1.5">NOMBRE</label>
        <input
          value={profile.display_name}
          onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
          className="input-base mb-3"
          placeholder="Tu nombre"
        />

        <label className="label-upper block mb-1.5">MODO IA POR DEFECTO</label>
        <div className="flex gap-[5px] flex-wrap mb-4">
          {(Object.entries(MODES) as [ModeName, typeof MODES.strategy][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setProfile({ ...profile, default_mode: k })}
              className="px-3 py-[5px] rounded-full text-[11px] font-bold cursor-pointer transition-all"
              style={{
                background: profile.default_mode === k ? v.color : "transparent",
                border: `1px solid ${profile.default_mode === k ? v.color : "rgba(255,255,255,0.07)"}`,
                color: profile.default_mode === k ? "#fff" : "#475569",
              }}
            >
              {v.emoji} {v.label}
            </button>
          ))}
        </div>

        <button onClick={saveProfile} disabled={saving} className="btn-primary text-xs">
          {saving ? "Guardando..." : "💾 Guardar cambios"}
        </button>
      </div>

      {/* Stats Section */}
      <div className="glass p-5 mb-4">
        <div className="label-upper mb-3">USO</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-[24px] font-black text-aion-accent">{totalMessages}</div>
            <div className="text-[10px] text-aion-muted font-semibold">Mensajes IA</div>
          </div>
          <div className="text-center">
            <div className="text-[24px] font-black text-aion-cyan">{totalProjects}</div>
            <div className="text-[10px] text-aion-muted font-semibold">Proyectos</div>
          </div>
          <div className="text-center">
            <div className="text-[24px] font-black text-aion-green">{totalStrategies}</div>
            <div className="text-[10px] text-aion-muted font-semibold">Estrategias</div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass p-5 mb-4">
        <div className="label-upper mb-3">GESTIÓN DE DATOS</div>

        <div className="flex items-center justify-between py-3 border-b border-aion-border">
          <div>
            <div className="text-xs font-semibold">Historial de chats</div>
            <div className="text-[10px] text-aion-muted">{totalMessages} mensajes en {Object.keys(MODES).length} modos</div>
          </div>
          <button
            onClick={handleClearChats}
            className={`btn-outline text-[11px] px-3 py-1 ${
              confirmClearChats ? "border-aion-red text-aion-red" : "border-slate-600 text-slate-500"
            }`}
          >
            {confirmClearChats ? "¿Seguro?" : "Borrar"}
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-xs font-semibold">Proyectos</div>
            <div className="text-[10px] text-aion-muted">{totalProjects} proyectos</div>
          </div>
          <button
            onClick={handleClearProjects}
            className={`btn-outline text-[11px] px-3 py-1 ${
              confirmClearProjects ? "border-aion-red text-aion-red" : "border-slate-600 text-slate-500"
            }`}
          >
            {confirmClearProjects ? "¿Seguro?" : "Borrar"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass p-5 border-aion-red/20">
        <div className="label-upper mb-3 text-aion-red">ZONA DE PELIGRO</div>
        <button
          onClick={handleDeleteAccount}
          className={`w-full py-2 rounded-lg text-[12px] font-semibold transition-all ${
            confirmDelete
              ? "bg-aion-red text-white"
              : "bg-aion-red/10 border border-aion-red/20 text-aion-red hover:bg-aion-red/20"
          }`}
        >
          {confirmDelete ? "Click de nuevo para cerrar sesión" : "Cerrar sesión y eliminar datos locales"}
        </button>
      </div>

      {/* Version info */}
      <div className="text-center mt-6 text-[10px] text-slate-800">
        AION v6.0 · AI Business OS · INZATECH © 2026
      </div>
    </div>
  );
}
