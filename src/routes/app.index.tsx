import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/hooks/useLanguage";
import { localData } from "@/lib/local-data";
import { brl } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, DollarSign, Scissors, AlertTriangle, UserPlus, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

type Stats = {
  todayRevenue: number;
  todayAppointments: number;
  newClientsMonth: number;
  lowStock: number;
};

function Dashboard() {
  const { barbershop } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    todayRevenue: 0,
    todayAppointments: 0,
    newClientsMonth: 0,
    lowStock: 0,
  });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barbershop) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthIso = monthStart.toISOString();

      const [salesRes, apptsRes, clientsRes, productsRes, upcomingRes] = await Promise.all([
        localData.from("sales").select("total_amount, created_at").eq("barbershop_id", barbershop.id).gte("created_at", `${today}T00:00:00`),
        localData.from("appointments").select("id").eq("barbershop_id", barbershop.id).eq("date", today),
        localData.from("clients").select("id").eq("barbershop_id", barbershop.id).gte("created_at", monthIso),
        localData.from("products").select("id, stock_quantity, min_stock_alert").eq("barbershop_id", barbershop.id),
        localData.from("appointments").select("id, time, status, notes, clients(name), services(name, price), professionals(name)").eq("barbershop_id", barbershop.id).eq("date", today).order("time").limit(5),
      ]);

      const lowStock = (productsRes.data ?? []).filter((p: any) => p.stock_quantity <= p.min_stock_alert).length;
      const todayRevenue = (salesRes.data ?? []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);

      setStats({
        todayRevenue,
        todayAppointments: apptsRes.data?.length ?? 0,
        newClientsMonth: clientsRes.data?.length ?? 0,
        lowStock,
      });
      setUpcoming(upcomingRes.data ?? []);
      setLoading(false);
    })();
  }, [barbershop]);

  const publicUrl =
    typeof window !== "undefined" && barbershop
      ? `${window.location.origin}/agendar/${barbershop.slug}`
      : "";

  const statusMap: Record<string, { label: () => string; cls: string }> = {
    pending: { label: () => t("appt_status_pending"), cls: "bg-muted text-muted-foreground" },
    confirmed: { label: () => t("appt_status_confirmed"), cls: "bg-gold/15 text-gold border-gold/30" },
    completed: { label: () => t("appt_status_completed"), cls: "bg-success/15 text-success border-success/30" },
    cancelled: { label: () => t("appt_status_cancelled"), cls: "bg-destructive/15 text-destructive border-destructive/30" },
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-3xl tracking-wide md:text-4xl">{t("dash_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("dash_sub")}</p>
        </div>
        <div className="flex w-full gap-2 md:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 md:flex-none"
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              toast.success(t("dash_link_copied"));
            }}
          >
            <Copy className="mr-2 h-3.5 w-3.5" /> {t("dash_copy_link")}
          </Button>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="flex-1 md:flex-none">
            <Button size="sm" className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
              <ExternalLink className="mr-2 h-3.5 w-3.5" /> {t("dash_booking_page")}
            </Button>
          </a>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <MetricCard icon={DollarSign} label={t("dash_revenue_today")} value={brl(stats.todayRevenue)} accent />
        <MetricCard icon={Scissors} label={t("dash_appts_today")} value={String(stats.todayAppointments)} />
        <MetricCard icon={UserPlus} label={t("dash_new_clients")} value={String(stats.newClientsMonth)} />
        <MetricCard icon={AlertTriangle} label={t("dash_low_stock")} value={String(stats.lowStock)} warning={stats.lowStock > 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Próximos */}
        <Card className="border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl tracking-wide">{t("dash_upcoming")}</h2>
            <Link to="/app/agendamentos" className="text-xs text-gold hover:underline">
              {t("dash_see_all")}
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/30" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              <CalendarDays className="mx-auto mb-2 h-8 w-8 opacity-40" />
              {t("dash_no_appts")}
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => {
                const m = statusMap[a.status] ?? statusMap.pending;
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3">
                    <div className="rounded-md bg-gold/10 px-3 py-1.5 font-mono text-sm text-gold">
                      {a.time?.slice(0, 5)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{a.clients?.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.services?.name} • {a.professionals?.name}
                      </div>
                    </div>
                    <Badge className={`border ${m.cls} font-normal`}>{m.label()}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Public link card */}
        <Card className="min-w-0 border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-5">
          <h3 className="font-display text-lg tracking-wide text-gold">{t("dash_link_title")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("dash_link_sub")}</p>
          <div className="mt-4 truncate rounded-md bg-background/60 p-3 font-mono text-xs" title={publicUrl}>
            {publicUrl}
          </div>
          <Button
            size="sm"
            className="mt-3 w-full bg-gradient-gold text-gold-foreground hover:opacity-90"
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              toast.success(t("dash_copied"));
            }}
          >
            <Copy className="mr-2 h-3.5 w-3.5" /> {t("dash_copy_wa")}
          </Button>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent, warning }: any) {
  return (
    <Card className={`border-border bg-card p-4 ${accent ? "shadow-gold border-gold/30" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent ? "text-gold" : warning ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 font-mono text-2xl font-bold ${warning ? "text-destructive" : ""}`}>{value}</div>
    </Card>
  );
}
