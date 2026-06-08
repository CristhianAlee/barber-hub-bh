import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl, formatDateBR } from "@/lib/format";
import { Plus, TrendingUp, TrendingDown, DollarSign, Receipt, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/app/financeiro")({
  component: FinanceiroPage,
});

type Entry = {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string | null;
  description: string | null;
  amount: number;
  payment_method: string | null;
};

type Period = "today" | "7d" | "30d" | "month" | "last_month" | "custom";

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

function FinanceiroPage() {
  const { barbershop } = useAuth();
  const { t } = useLanguage();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [openNew, setOpenNew] = useState(false);
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState(fmtDate(new Date()));
  const [customTo, setCustomTo] = useState(fmtDate(new Date()));

  function getDateRange(): { from: string; to: string } {
    const now = new Date();
    const today = fmtDate(now);
    switch (period) {
      case "today": return { from: today, to: today };
      case "7d": {
        const d = new Date(); d.setDate(d.getDate() - 6);
        return { from: fmtDate(d), to: today };
      }
      case "30d": {
        const d = new Date(); d.setDate(d.getDate() - 29);
        return { from: fmtDate(d), to: today };
      }
      case "month": {
        const d = new Date(); d.setDate(1);
        return { from: fmtDate(d), to: today };
      }
      case "last_month": {
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 0);
        return { from: fmtDate(first), to: fmtDate(last) };
      }
      case "custom": return { from: customFrom, to: customTo };
    }
  }

  const load = async () => {
    if (!barbershop) return;
    const { from, to } = getDateRange();
    setLoading(true);
    const { data } = await supabase
      .from("financial_entries")
      .select("id, date, type, category, description, amount, payment_method")
      .eq("barbershop_id", barbershop.id)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false });
    setEntries((data as Entry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershop, period, customFrom, customTo]);

  const monthly = useMemo(() => {
    const inc = entries.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
    const exp = entries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
    const count = entries.filter((e) => e.type === "income").length;
    return { income: inc, expense: exp, profit: inc - exp, ticket: count > 0 ? inc / count : 0 };
  }, [entries]);

  const today = fmtDate(new Date());
  const dayReport = useMemo(() => {
    const day = entries.filter((e) => e.date === today);
    const inc = day.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
    const exp = day.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
    return { count: day.filter((e) => e.type === "income").length, income: inc, expense: exp, profit: inc - exp };
  }, [entries, today]);

  const chartData = useMemo(() => {
    const weeks = [0, 0, 0, 0, 0].map(() => ({ income: 0, expense: 0 }));
    entries.forEach((e) => {
      const d = new Date(e.date + "T00:00:00");
      const w = Math.min(4, Math.floor((d.getDate() - 1) / 7));
      if (e.type === "income") weeks[w].income += Number(e.amount);
      else weeks[w].expense += Number(e.amount);
    });
    return weeks.map((w, i) => ({ name: `${t("fin_week")} ${i + 1}`, Receita: w.income, Despesa: w.expense }));
  }, [entries, t]);

  const filtered = entries.filter((e) => filterType === "all" || e.type === filterType);
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const periodLabels: Record<Period, string> = {
    today: t("fin_period_today"),
    "7d": t("fin_period_7d"),
    "30d": t("fin_period_30d"),
    month: t("fin_period_month"),
    last_month: t("fin_period_last"),
    custom: t("fin_period_custom"),
  };

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide md:text-4xl">{t("fin_title")}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date())}
          </p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> {t("fin_entry")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <EntryForm onDone={() => { setOpenNew(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Period filter */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setPage(0); }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                period === p
                  ? "border-gold/50 bg-gold/15 text-gold"
                  : "border-border text-muted-foreground hover:border-gold/30 hover:text-foreground"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">{t("fin_custom_from")}</Label>
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 w-36 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">{t("fin_custom_to")}</Label>
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 w-36 text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard icon={TrendingUp} label={t("fin_revenue")} value={brl(monthly.income)} accent="success" />
        <MetricCard icon={TrendingDown} label={t("fin_expense")} value={brl(monthly.expense)} accent="destructive" />
        <MetricCard icon={DollarSign} label={t("fin_profit")} value={brl(monthly.profit)} accent="gold" />
        <MetricCard icon={Receipt} label={t("fin_avg_ticket")} value={brl(monthly.ticket)} />
      </div>

      {/* Gráfico */}
      <Card className="border-border bg-card p-5">
        <h2 className="mb-4 font-display text-xl tracking-wide">{t("fin_chart_title")}</h2>
        {loading ? (
          <div className="h-64 animate-pulse rounded bg-muted/30" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} style={{ background: "transparent" }} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0 0)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} axisLine={{ stroke: "oklch(0.28 0 0)" }} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  cursor={{ fill: "oklch(0.78 0.14 75 / 0.06)" }}
                  contentStyle={{ background: "oklch(0.14 0 0)", border: "1px solid oklch(0.26 0 0)", borderRadius: 10, fontSize: 12, color: "oklch(0.92 0 0)" }}
                  labelStyle={{ color: "oklch(0.78 0.14 75)", fontWeight: 600, marginBottom: 4 }}
                  formatter={(v: number) => [brl(v)]}
                />
                <Bar dataKey="Receita" fill="oklch(0.78 0.14 75)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Despesa" fill="oklch(0.58 0.21 27)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Relatório do dia */}
      <Card className="border-gold/30 bg-gradient-to-br from-gold/10 to-card p-5">
        <h2 className="mb-3 font-display text-xl tracking-wide text-gold">{t("fin_day_report")}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DayStat label={t("fin_day_appointments")} value={String(dayReport.count)} />
          <DayStat label={t("fin_day_income")} value={brl(dayReport.income)} />
          <DayStat label={t("fin_day_expense")} value={brl(dayReport.expense)} />
          <DayStat label={t("fin_day_profit")} value={brl(dayReport.profit)} accent />
        </div>
      </Card>

      {/* Tabela */}
      <Card className="border-border bg-card p-2 md:p-4">
        <div className="flex items-center justify-between p-2">
          <h2 className="font-display text-xl tracking-wide">{t("fin_entries")}</h2>
          <Select value={filterType} onValueChange={(v: any) => { setFilterType(v); setPage(0); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("fin_all")}</SelectItem>
              <SelectItem value="income">{t("fin_revenues")}</SelectItem>
              <SelectItem value="expense">{t("fin_expenses_label")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />)}
          </div>
        ) : paginated.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{t("fin_no_entries")}</p>
        ) : (
          <>
            <div className="space-y-1">
              {paginated.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg p-2.5 text-sm">
                  <div className="w-20 font-mono text-xs text-muted-foreground">
                    {formatDateBR(e.date).split(" de ").slice(0, 2).join("/")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{e.description ?? e.category ?? "—"}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {e.category ?? t("fin_no_category")}{e.payment_method && ` • ${e.payment_method}`}
                    </div>
                  </div>
                  <Badge className={`border font-normal ${
                    e.type === "income"
                      ? "border-success/30 bg-success/15 text-success"
                      : "border-destructive/30 bg-destructive/15 text-destructive"
                  }`}>
                    {e.type === "income" ? t("fin_income_type") : t("fin_expense_type")}
                  </Badge>
                  <div className={`font-mono font-bold ${e.type === "income" ? "text-success" : "text-destructive"}`}>
                    {e.type === "income" ? "+" : "−"}{brl(Number(e.amount))}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 text-xs text-muted-foreground">
                <span>{t("fin_page")} {page + 1} {t("fin_of")} {totalPages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>{t("fin_prev")}</Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>{t("fin_next")}</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent }: any) {
  const cls =
    accent === "success" ? "text-success" :
    accent === "destructive" ? "text-destructive" :
    accent === "gold" ? "text-gold" : "text-muted-foreground";
  return (
    <Card className={`border-border bg-card p-4 ${accent === "gold" ? "shadow-gold border-gold/30" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${cls}`} />
      </div>
      <div className={`mt-2 font-mono text-xl font-bold md:text-2xl ${cls}`}>{value}</div>
    </Card>
  );
}

function DayStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono text-lg font-bold ${accent ? "text-gold" : ""}`}>{value}</div>
    </div>
  );
}

function EntryForm({ onDone }: { onDone: () => void }) {
  const { barbershop } = useAuth();
  const { t } = useLanguage();
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(fmtDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const a = Number(amount);
    if (!barbershop || !a || a <= 0) return toast.error("Valor inválido");
    setSaving(true);
    const { error } = await supabase.from("financial_entries").insert({
      barbershop_id: barbershop.id,
      type, category: category || null, description: description || null,
      amount: a, date, payment_method: paymentMethod as any,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("fin_registered"));
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl tracking-wide">{t("fin_new_entry")}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button variant={type === "income" ? "default" : "outline"} onClick={() => setType("income")} className={type === "income" ? "bg-success text-success-foreground" : ""}>
            <TrendingUp className="mr-1 h-4 w-4" /> {t("fin_income_type")}
          </Button>
          <Button variant={type === "expense" ? "default" : "outline"} onClick={() => setType("expense")} className={type === "expense" ? "bg-destructive text-destructive-foreground" : ""}>
            <TrendingDown className="mr-1 h-4 w-4" /> {t("fin_expense_type")}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("fin_value")}</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("date")}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t("category")}</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={type === "income" ? "Serviços, produtos..." : "Aluguel, materiais..."} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("description")}</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("fin_payment_method")}</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">{t("fin_payment_cash")}</SelectItem>
              <SelectItem value="pix">{t("fin_payment_pix")}</SelectItem>
              <SelectItem value="debit">{t("fin_payment_debit")}</SelectItem>
              <SelectItem value="credit">{t("fin_payment_credit")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={submit} disabled={saving} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
        </Button>
      </div>
    </>
  );
}
