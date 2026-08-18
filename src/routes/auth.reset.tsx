import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { passwordStrength } from "@/lib/format";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/auth/reset")({
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const ps = passwordStrength(pw);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8 || pw !== confirm) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) {
      toast.error(t("auth_reset_failed"));
      return;
    }
    toast.success(t("auth_password_reset_success"));
    await supabase.auth.signOut();
    navigate({ to: "/auth/login" });
  };

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide">{t("auth_new_password_title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth_new_password_sub")}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pw">{t("auth_new_password_label")}</Label>
          <Input id="pw" type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />
          {pw && <p className="text-xs text-muted-foreground">{t("auth_strength_prefix")} {t(ps.labelKey)}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf">{t("confirm")}</Label>
          <Input id="cf" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading || pw.length < 8 || pw !== confirm} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth_reset_password_btn")}
        </Button>
      </form>
    </div>
  );
}
