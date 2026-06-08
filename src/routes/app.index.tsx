import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";
import { brl } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays, DollarSign, Scissors, AlertTriangle,
  UserPlus, ExternalLink, Copy, Package, Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Line, LineChart, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

type Stats = {
  todayRevenue: number;
  todayAppointments: number;
  newClientsMonth: number;
  lowStock: number;
};

type ChartPoint = { day: string; thisWeek: number; prevWeek: number };

const fmtD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

function Dashboard() {
  const { barbershop } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    todayRevenue: 0, todayAppointments: 0, newClientsMonth: 0, lowStock: 0,
  });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barbershop) return;
    (async () => {
      const today = fmtD(new Date());
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = fmtD(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

      // Build 14-day date array (index 0 = 13 days ago, index 13 = today)
      const dates14: string[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dates14.push(fmtD(d));
      }
      const date14ago = new Date(); date14ago.setDate(date14ago.getDate() - 14);

      const [salesRes, apptsRes, clientsMonthRes, productsRes, upcomingRes, finRes, clientsAllRes] =
        await Promise.all([
          supabase.from("sales").select("total_amount").eq("barbershop_id", barbershop.id).gte("created_at", `${today}T00:00:00`),
          supabase.from("appointments").select("id").eq("barbershop_id", barbershop.id).eq("date", today),
          supabase.from("clients").select("id").eq("barbershop_id", barbershop.id).gte("created_at", monthStart.toISOString()),
          supabase.from("products").select("id, stock_quantity, min_stock_alert").eq("barbershop_id", barbershop.id),
          supabase.from("appointments").select("id, time, status, clients(name), services(name, price), professionals(name)").eq("barbershop_id", barbershop.id).eq("date", today).order("time").limit(5),
          supabase.from("financial_entries").select("date, amount").eq("barbershop_id", barbershop.id).gte("date", fmtD(date14ago)).eq("type", "income"),
          supabase.from("clients").select("id, last_visit").eq("barbershop_id", barbershop.id),
        ]);

      const lowStock = (productsRes.data ?? []).filter((p: any) => Number(p.stock_quantity) <= Number(p.min_stock_alert)).length;
      const todayRevenue = (salesRes.data ?? []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);

      setStats({
        todayRevenue,
        todayAppointments: apptsRes.data?.length ?? 0,
        newClientsMonth: clientsMonthRes.data?.length ?? 0,
        lowStock,
      });
      setUpcoming(upcomingRes.data ?? []);

      // 7-day chart: previous week vs current week
      const byDate: Record<string, number> = {};
      for (const e of finRes.data ?? []) {
        byDate[(e as any).date] = (byDate[(e as any).date] ?? 0) + Number((e as any).amount);
      }
      setChartData(
        dates14.slice(7).map((date, i) => ({
          day: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3),
          thisWeek: byDate[date] ?? 0,
          prevWeek: byDate[dates14[i]] ?? 0,
        }))
      );

      // Inactive clients
      const inactive = (clientsAllRes.data ?? []).filter(
        (c: any) => !c.last_visit || c.last_visit < thirtyDaysAgo
      ).length;
      setInactiveCount(inactive);

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

      {/* Alert cards */}
      {(stats.lowStock > 0 || inactiveCount > 0) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {stats.lowStock > 0 && (
            <Link to="/app/estoque" className="flex-1">
              <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 transition hover:bg-destructive/15">
                <Package className="h-5 w-5 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-destructive">{t("dash_alert_stock_title")}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-destructive">{stats.lowStock}</span> {t("dash_alert_stock_body")}
                  </div>
                </div>
              </div>
            </Link>
          )}
          {inactiveCount > 0 && (
            <Link to="/app/clientes" className="flex-1">
              <div className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 transition hover:bg-warning/15">
                <Users className="h-5 w-5 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-warning">{t("dash_alert_inactive_title")}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-warning">{inactiveCount}</span> {t("dash_alert_inactive_body")}
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* 7-day chart */}
      <Card className="border-border bg-card p-5">
        <h2 className="mb-4 font-display text-xl tracking-wide">{t("dash_chart_title")}</h2>
        {loading ? (
          <div className="h-48 animate-pulse rounded bg-muted/30" />
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0 0)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}k` : "0"} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.14 0 0)", border: "1px solid oklch(0.26 0 0)", borderRadius: 10, fontSize: 12, color: "oklch(0.92 0 0)" }}
                  labelStyle={{ color: "oklch(0.78 0.14 75)", fontWeight: 600, marginBottom: 4 }}
                  formatter={(v: number, name: string) => [brl(v), name === "thisWeek" ? t("dash_chart_this_week") : t("dash_chart_prev_week")]}
                />
                <Line
                  type="monotone"
                  dataKey="thisWeek"
                  stroke="oklch(0.78 0.14 75)"
                  strokeWidth={2.5}
                  dot={{ fill: "oklch(0.78 0.14 75)", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="prevWeek"
                  stroke="oklch(0.50 0 0)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-6 rounded-full bg-gold" />
            {t("dash_chart_this_week")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-6 border-t-2 border-dashed border-muted-foreground" />
            {t("dash_chart_prev_week")}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Próximos agendamentos */}
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
