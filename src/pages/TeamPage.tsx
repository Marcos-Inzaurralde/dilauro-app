// ─────────────────────────────────────────────────────────────
// AION — Team Management Page (Tailwind)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "../config/supabase";

interface TeamPageProps {
  addToast: (msg: string, type?: "info" | "success" | "error") => void;
}

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited" | "removed";
  joined_at: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: string;
  max_members: number;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "#F59E0B",
  admin: "#7C3AED",
  member: "#06B6D4",
  viewer: "#475569",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Miembro",
  viewer: "Viewer",
};

export function TeamPage({ addToast }: TeamPageProps) {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviting, setInviting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  // Load team data
  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    loadTeam();
  }, [user]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      // Find teams where user is a member
      const { data: memberRows } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .limit(1);

      if (memberRows && memberRows.length > 0) {
        const teamId = memberRows[0].team_id;

        // Fetch team
        const { data: teamData } = await supabase
          .from("teams")
          .select("*")
          .eq("id", teamId)
          .single();

        if (teamData) {
          setTeam(teamData as Team);

          // Fetch members
          const { data: membersData } = await supabase
            .from("team_members")
            .select("*")
            .eq("team_id", teamId)
            .order("role", { ascending: true });

          setMembers((membersData || []) as TeamMember[]);
        }
      }
    } catch (e) {
      console.warn("[AION] loadTeam failed:", e);
    }
    setLoading(false);
  };

  const createTeam = async () => {
    if (!teamName.trim() || !user || creating) return;
    setCreating(true);
    try {
      const slug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: teamName,
          slug,
          owner_id: user.id,
          plan: "free",
          max_members: 2,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as first member
      await supabase.from("team_members").insert({
        team_id: data.id,
        user_id: user.id,
        email: user.email || "",
        display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Owner",
        role: "owner",
        status: "active",
      });

      addToast("Equipo creado exitosamente", "success");
      setShowCreate(false);
      setTeamName("");
      loadTeam();
    } catch (e) {
      addToast(`Error: ${(e as Error).message}`, "error");
    }
    setCreating(false);
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !team || inviting) return;
    if (members.length >= team.max_members) {
      addToast(`Límite de ${team.max_members} miembros alcanzado. Upgrade tu plan.`, "error");
      return;
    }
    setInviting(true);
    try {
      const { error } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: null,
        email: inviteEmail.trim().toLowerCase(),
        display_name: inviteEmail.split("@")[0],
        role: inviteRole,
        status: "invited",
      });

      if (error) throw error;
      addToast(`Invitación enviada a ${inviteEmail}`, "success");
      setInviteEmail("");
      loadTeam();
    } catch (e) {
      addToast(`Error: ${(e as Error).message}`, "error");
    }
    setInviting(false);
  };

  const removeMember = async (memberId: string) => {
    try {
      await supabase
        .from("team_members")
        .update({ status: "removed" })
        .eq("id", memberId);

      addToast("Miembro removido", "info");
      loadTeam();
    } catch (e) {
      addToast("Error al remover miembro", "error");
    }
  };

  const updateRole = async (memberId: string, newRole: string) => {
    try {
      await supabase
        .from("team_members")
        .update({ role: newRole })
        .eq("id", memberId);

      addToast("Rol actualizado", "success");
      loadTeam();
    } catch (e) {
      addToast("Error al actualizar rol", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-5 max-w-[700px] mx-auto">
        <div className="text-center py-20 text-aion-muted text-sm animate-blink">
          Cargando equipo...
        </div>
      </div>
    );
  }

  // No team yet
  if (!team) {
    return (
      <div className="p-5 max-w-[600px] mx-auto">
        <h1 className="text-[19px] font-black tracking-tight mb-1">
          👥 Equipos
        </h1>
        <p className="text-aion-muted text-[11px] mb-6">
          Colaborá en tiempo real con tu equipo.
        </p>

        {!showCreate ? (
          <div className="glass p-8 text-center">
            <div className="text-[48px] mb-4">👥</div>
            <h2 className="text-lg font-bold mb-2">Creá tu primer equipo</h2>
            <p className="text-aion-muted text-sm mb-6 max-w-[320px] mx-auto">
              Invitá miembros, asigná roles y colaborá en proyectos y estrategias.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
            >
              + Crear equipo
            </button>
          </div>
        ) : (
          <div className="glass p-6">
            <div className="label-upper mb-3">NUEVO EQUIPO</div>
            <label className="label-upper block mb-1.5">NOMBRE DEL EQUIPO</label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Ej: Startup LATAM"
              className="input-base mb-4"
              onKeyDown={(e) => e.key === "Enter" && createTeam()}
            />
            <div className="flex gap-2">
              <button onClick={createTeam} disabled={creating} className="btn-primary">
                {creating ? "Creando..." : "Crear equipo"}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-outline border-aion-border text-aion-muted">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Team exists
  const isOwner = team.owner_id === user?.id;
  const activeMembers = members.filter((m) => m.status !== "removed");

  return (
    <div className="p-5 max-w-[700px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[19px] font-black tracking-tight mb-1">
            👥 {team.name}
          </h1>
          <p className="text-aion-muted text-[11px]">
            {activeMembers.length}/{team.max_members} miembros · Plan {team.plan}
          </p>
        </div>
        <div className="tag bg-aion-accent/10 text-aion-accent border border-aion-accent/20">
          {team.plan.toUpperCase()}
        </div>
      </div>

      {/* Members list */}
      <div className="glass p-5 mb-4">
        <div className="label-upper mb-3">MIEMBROS</div>
        {activeMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between py-3 border-b border-aion-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: ROLE_COLORS[member.role] }}
              >
                {(member.display_name || member.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[13px] font-semibold">{member.display_name || member.email}</div>
                <div className="text-[10px] text-aion-muted">{member.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.status === "invited" && (
                <span className="tag bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Pendiente
                </span>
              )}
              {isOwner && member.role !== "owner" ? (
                <select
                  value={member.role}
                  onChange={(e) => updateRole(member.id, e.target.value)}
                  className="bg-white/5 border border-aion-border rounded-lg px-2 py-1
                             text-[11px] text-aion-text outline-none cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Miembro</option>
                  <option value="viewer">Viewer</option>
                </select>
              ) : (
                <span
                  className="tag border"
                  style={{
                    color: ROLE_COLORS[member.role],
                    borderColor: ROLE_COLORS[member.role] + "33",
                    background: ROLE_COLORS[member.role] + "15",
                  }}
                >
                  {ROLE_LABELS[member.role]}
                </span>
              )}
              {isOwner && member.role !== "owner" && (
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-aion-red text-[11px] hover:bg-aion-red/10 rounded px-2 py-1 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite */}
      {isOwner && (
        <div className="glass p-5">
          <div className="label-upper mb-3">INVITAR MIEMBRO</div>
          <div className="flex gap-2">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="input-base flex-1"
              onKeyDown={(e) => e.key === "Enter" && inviteMember()}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "member" | "viewer")}
              className="bg-white/5 border border-aion-border rounded-lg px-3 py-2
                         text-xs text-aion-text outline-none cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="member">Miembro</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={inviteMember}
              disabled={inviting || !inviteEmail.trim()}
              className="btn-primary"
            >
              {inviting ? "..." : "Invitar"}
            </button>
          </div>
          {activeMembers.length >= team.max_members && (
            <div className="text-[11px] text-aion-amber mt-2">
              ⚠️ Límite de {team.max_members} miembros alcanzado.
              <button className="text-aion-accent ml-1 underline">Upgrade plan →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
