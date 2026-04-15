import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, CreditCard, Key, Loader2, Save, BarChart3, Gift, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
}

interface CreditsData {
  balance: number;
}

interface SubData {
  plan: string;
  status: string;
}

interface UsageEntry {
  action: string;
  count: number;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>({ full_name: "", avatar_url: null });
  const [credits, setCredits] = useState<CreditsData>({ balance: 0 });
  const [subscription, setSubscription] = useState<SubData>({ plan: "free", status: "active" });
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const [profileRes, creditsRes, subRes] = await Promise.all([
          supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
          supabase.from("credits").select("balance").eq("user_id", user.id).single(),
          supabase.from("subscriptions").select("plan, status").eq("user_id", user.id).single(),
        ]);
        if (profileRes.data) {
          setProfile(profileRes.data);
          setFullName(profileRes.data.full_name || "");
        }
        if (creditsRes.data) setCredits(creditsRes.data);
        if (subRes.data) setSubscription(subRes.data);

        // Load referral data
        const { data: profileRef } = await supabase
          .from("profiles")
          .select("referral_code")
          .eq("id", user.id)
          .single();

        if (profileRef?.referral_code) {
          setReferralCode(profileRef.referral_code);
        } else {
          // Generate one
          const code = `MORPHIC-${user.id.slice(0, 8).toUpperCase()}`;
          await supabase.from("profiles").update({ referral_code: code }).eq("id", user.id);
          setReferralCode(code);
        }

        const { count } = await supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", user.id)
          .eq("status", "completed");
        setReferralCount(count ?? 0);

        // Load usage stats
        const { data: logs } = await supabase
          .from("logs")
          .select("action")
          .eq("user_id", user.id);
        if (logs) {
          const counts: Record<string, number> = {};
          logs.forEach((l: any) => { counts[l.action] = (counts[l.action] || 0) + 1; });
          setUsage(Object.entries(counts).map(([action, count]) => ({ action, count })));
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to update profile");
      } else {
        toast.success("Profile updated");
        setProfile((p) => ({ ...p, full_name: fullName }));
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>

        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

        {/* Profile Section */}
        <section className="mt-8 rounded-2xl border border-white/5 bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <User className="h-4 w-4" />
            Profile
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <p className="mt-1 text-sm">{user?.email}</p>
            </div>
            <div>
              <label htmlFor="fullName" className="text-xs font-medium text-muted-foreground">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Your name"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || fullName === (profile.full_name || "")}
              className="gap-1.5 bg-primary hover:bg-primary/90"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </section>

        {/* Credits & Plan */}
        <section className="mt-6 rounded-2xl border border-white/5 bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Plan & Credits
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-background p-4">
              <p className="text-xs text-muted-foreground">Current Plan</p>
              <p className="mt-1 text-lg font-bold capitalize">{subscription.plan}</p>
              <p className="text-xs text-muted-foreground capitalize">{subscription.status}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-background p-4">
              <p className="text-xs text-muted-foreground">Credits Remaining</p>
              <p className="mt-1 text-lg font-bold text-violet-400">{credits.balance}</p>
              <p className="text-xs text-muted-foreground">AI operations</p>
            </div>
          </div>
        </section>

        {/* Usage Analytics */}
        <section className="mt-6 rounded-2xl border border-white/5 bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            Usage Analytics
          </h2>
          {usage.length === 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">No activity yet. Start a project to see usage stats.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {usage.map((entry) => {
                const maxCount = Math.max(...usage.map((u) => u.count), 1);
                return (
                  <div key={entry.action}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{entry.action.replace(/_/g, " ")}</span>
                      <span className="font-medium">{entry.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{ width: `${(entry.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Referral */}
        <section className="mt-6 rounded-2xl border border-violet-500/10 bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Gift className="h-4 w-4" />
            Referral Program
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Invite friends and earn 20 credits for each person who signs up and creates a project.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-white/10 bg-background px-3 py-2 text-sm">
              {referralCode}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(referralCode);
                setCopied(true);
                toast.success("Referral code copied!");
                setTimeout(() => setCopied(false), 2000);
              }}
              className="gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-violet-400">{referralCount}</span> successful referral{referralCount !== 1 ? "s" : ""}
          </p>
        </section>

        {/* API Keys */}
        <section className="mt-6 rounded-2xl border border-white/5 bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Key className="h-4 w-4" />
            API Access
          </h2>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">User ID</p>
            <code className="mt-1 block rounded bg-background px-3 py-2 text-xs text-muted-foreground">
              {user?.id}
            </code>
          </div>
        </section>

        {/* Actions */}
        <section className="mt-6 rounded-2xl border border-red-500/10 bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400">Danger Zone</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Sign out of your account. Your projects and data will be preserved.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="mt-4 border-red-500/20 text-red-400 hover:bg-red-500/10"
          >
            Sign Out
          </Button>
        </section>
      </div>
    </div>
  );
}
