import { useState, useEffect } from "react";
import { UserPlus, X, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Collaborator {
  id: string;
  email: string;
  role: string;
  status: string;
}

interface Props {
  projectId: string;
}

export default function CollaboratorInvite({ projectId }: Props) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadCollaborators();
  }, [projectId]);

  const loadCollaborators = async () => {
    const { data } = await supabase
      .from("project_collaborators")
      .select("id, email, role, status")
      .eq("project_id", projectId);
    setCollaborators(data ?? []);
  };

  const handleInvite = async () => {
    if (!email.trim() || !user) return;
    setInviting(true);
    try {
      const { error } = await supabase.from("project_collaborators").insert({
        project_id: projectId,
        email: email.trim(),
        invited_by: user.id,
        role: "viewer",
        status: "pending",
      });
      if (error) {
        toast.error("Failed to send invitation. Please try again.");
      } else {
        toast.success(`Invited ${email.trim()}`);
        setEmail("");
        loadCollaborators();
      }
    } catch {
      toast.error("Failed to invite");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: string) => {
    await supabase.from("project_collaborators").delete().eq("id", id);
    toast.success("Collaborator removed");
    loadCollaborators();
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-card p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <UserPlus className="h-4 w-4 text-violet-400" />
        Collaborators
      </h3>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            placeholder="teammate@email.com"
            className="w-full rounded-lg border border-white/10 bg-background py-2 pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none"
          />
        </div>
        <Button
          size="sm"
          onClick={handleInvite}
          disabled={!email.trim() || inviting}
          className="gap-1 bg-primary text-xs hover:bg-primary/90"
        >
          {inviting ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
          Invite
        </Button>
      </div>

      {collaborators.length > 0 && (
        <ul className="mt-4 space-y-2">
          {collaborators.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
              <div>
                <p className="text-sm">{c.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{c.role} - {c.status}</p>
              </div>
              <button onClick={() => handleRemove(c.id)} className="text-muted-foreground hover:text-red-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
