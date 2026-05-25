import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { localData } from "@/lib/local-data";
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

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

function FinanceiroPage() {
  const { barbershop } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [openNew, setOpenNew] = useState(false);
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const load = async () => {
    if (!barbershop) return;
    setLoading(true);
    const { data } = await localData
      .from("financial_entries")
      .select("id, date, type, category, description, amount, payment_method")
      .eq("barbershop_id", barbershop.id)
      .gte("date", fmtDate(monthStart))
      .order("date", { ascending: false });
    setEntries((data as Entry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [barbershop]);

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
    // Group by week of month
    const weeks = [0, 0, 0, 0, 0].map(() => ({ income: 0, expense: 0 }));
    entries.forEach((e) => {
      const d = new Date(e.date + "T00:00:00");
      const w = Math.min(4, Math.floor((d.getDate() - 1) / 7));
      if (e.type === "income") weeks[w].income += Number(e.amount);
      else weeks[w].expense += Number(e.amount);
    });
    return weeks.map((w, i) => ({ name: `Sem ${i + 1}`, Receita: w.income, Despesa: w.expense }));
  }, [entries]);

  const filtered = entries.filter((e) => filterType === "all" || e.type === filterType);
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide md:text-4xl">Financeiro</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date())}
          </p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <EntryForm onDone={() => { setOpenNew(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas do mês */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard icon={TrendingUp} label="Receita" value={brl(monthly.income)} accent="success" />
        <MetricCard icon={TrendingDown} label="Despesas" value={brl(monthly.expense)} accent="destructive" />
        <MetricCard icon={DollarSign} label="Lucro" value={brl(monthly.profit)} accent="gold" />
        <MetricCard icon={Receipt} label="Ticket médio" value={brl(monthly.ticket)} />
      </div>

      {/* Gráfico */}
      <Card className="border-border bg-card p-5">
        <h2 className="mb-4 font-display text-xl tracking-wide">Receita × Despesa por semana</h2>
        {loading ? (
          <div className="h-64 animate-pulse rounded bg-muted/30" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => brl(v)}
                />
                <Bar dataKey="Receita" fill="#f5a623" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Relatório do dia */}
      <Card className="border-gold/30 bg-gradient-to-br from-gold/10 to-card p-5">
        <h2 className="mb-3 font-display text-xl tracking-wide text-gold">Relatório de hoje</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DayStat label="Atendimentos" value={String(dayReport.count)} />
          <DayStat label="Arrecadado" value={brl(dayReport.income)} />
          <DayStat label="Custos" value={brl(dayReport.expense)} />
          <DayStat label="Lucro" value={brl(dayReport.profit)} accent />
        </div>
      </Card>

      {/* Tabela */}
      <Card className="border-border bg-card p-2 md:p-4">
        <div className="flex items-center justify-between p-2">
          <h2 className="font-display text-xl tracking-wide">Lançamentos</h2>
          <Select value={filterType} onValueChange={(v: any) => { setFilterType(v); setPage(0); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />)}
          </div>
        ) : paginated.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum lançamento.</p>
        ) : (
          <>
            <div className="space-y-1">
              {paginated.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg p-2.5 text-sm">
                  <div className="font-mono text-xs text-muted-foreground w-20">
                    {formatDateBR(e.date).split(" de ").slice(0, 2).join("/")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{e.description ?? e.category ?? "—"}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {e.category ?? "Sem categoria"}{e.payment_method && ` • ${e.payment_method}`}
                    </div>
                  </div>
                  <Badge className={`border font-normal ${
                    e.type === "income"
                      ? "border-success/30 bg-success/15 text-success"
                      : "border-destructive/30 bg-destructive/15 text-destructive"
                  }`}>
                    {e.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                  <div className={`font-mono font-bold ${e.type === "income" ? "text-success" : "text-destructive"}`}>
                    {e.type === "income" ? "+" : "−"}{brl(Number(e.amount))}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 text-xs text-muted-foreground">
                <span>Página {page + 1} de {totalPages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próxima</Button>
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
    const { error } = await localData.from("financial_entries").insert({
      barbershop_id: barbershop.id,
      type, category: category || null, description: description || null,
      amount: a, date, payment_method: paymentMethod as any,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Lançamento registrado");
    onDone();
  };

  return (
    <>
      <DialogHeader><DialogTitle className="font-display text-2xl tracking-wide">Novo lançamento</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button variant={type === "income" ? "default" : "outline"} onClick={() => setType("income")} className={type === "income" ? "bg-success text-success-foreground" : ""}>
            <TrendingUp className="mr-1 h-4 w-4" /> Receita
          </Button>
          <Button variant={type === "expense" ? "default" : "outline"} onClick={() => setType("expense")} className={type === "expense" ? "bg-destructive text-destructive-foreground" : ""}>
            <TrendingDown className="mr-1 h-4 w-4" /> Despesa
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Valor *</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Categoria</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={type === "income" ? "Serviços, produtos..." : "Aluguel, materiais..."} /></div>
        <div className="space-y-1.5"><Label>Descrição</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="space-y-1.5">
          <Label>Forma de pagamento</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="debit">Débito</SelectItem>
              <SelectItem value="credit">Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={submit} disabled={saving} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </>
  );
}
