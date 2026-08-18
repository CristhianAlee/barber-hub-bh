import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { Loader2, MailCheck } from "lucide-react";

export const Route = createFileRoute("/auth/recover")({
  component: Recover,
});

function Recover() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authService.resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(t("auth_recover_failed"));
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
          <MailCheck className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl tracking-wide">{t("auth_check_email_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth_recover_sent_prefix")} <strong className="text-foreground">{email}</strong>.
        </p>
        <Link to="/auth/login" className="mt-6 inline-block text-sm text-gold hover:underline">
          {t("auth_back_to_login_1")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide">{t("auth_recover_title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth_recover_sub")}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth_send_link_btn")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth_remembered")}{" "}
        <Link to="/auth/login" className="text-gold hover:underline">
          {t("auth_back_to_login_2")}
        </Link>
      </p>
    </div>
  );
}
