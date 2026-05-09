import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brl, formatPhone, onlyDigits, formatDateBR } from "@/lib/format";
import { Search, Users, Bell, MessageCircle, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clientes")({
  component: ClientesPage,
});

type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  total_visits: number;
  total_spent: number;
  last_visit: string | null;
  notes: string | null;
  created_at: string;
};

const DAYS_INACTIVE = 30;

function daysSince(iso: string | null) {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function ClientesPage() {
  const { barbershop } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Client | null>(null);
  const [reminderMsg, setReminderMsg] = useState(
    "Oi {nome}! Faz um tempo que não te vemos aqui na {barbearia}. Bora agendar seu próximo corte? 💈 {link}"
  );

  const load = async () => {
    if (!barbershop) return;
    setLoading(true);
    const since = new Date(Date.now() - DAYS_INACTIVE * 86400000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const [c, recent] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, phone, email, total_visits, total_spent, last_visit, notes, created_at")
        .eq("barbershop_id", barbershop.id)
        .order("name"),
      // Active = has confirmed/completed appt within last 30d OR any future pending/confirmed
      supabase
        .from("appointments")
        .select("client_id, date, status")
        .eq("barbershop_id", barbershop.id)
        .in("status", ["pending", "confirmed", "completed"])
        .gte("date", since),
    ]);
    setClients((c.data as Client[]) ?? []);
    const set = new Set<string>();
    (recent.data ?? []).forEach((a: any) => {
      if (a.status === "completed" || a.status === "confirmed" || (a.status === "pending" && a.date >= today)) {
        set.add(a.client_id);
      }
    });
    setActiveIds(set);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [barbershop]);

  const isInactive = (c: Client) => !activeIds.has(c.id) && daysSince(c.last_visit) > DAYS_INACTIVE;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(onlyDigits(q))
    );
  }, [clients, search]);

  const inactive = useMemo(
    () => clients.filter((c) => isInactive(c)),
    [clients, activeIds]
  );

  const publicLink =
    typeof window !== "undefined" && barbershop
      ? `${window.location.origin}/agendar/${barbershop.slug}`
      : "";

  const buildReminder = (c: Client) =>
    reminderMsg
      .replace(/\{nome\}/g, c.name.split(" ")[0])
      .replace(/\{barbearia\}/g, barbershop?.name ?? "")
      .replace(/\{link\}/g, publicLink);

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl tracking-wide md:text-4xl">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          {clients.length} cliente{clients.length !== 1 && "s"} cadastrado
          {clients.length !== 1 && "s"}
        </p>
      </div>

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista"><Users className="mr-2 h-3.5 w-3.5" />Lista</TabsTrigger>
          <TabsTrigger value="lembretes">
            <Bell className="mr-2 h-3.5 w-3.5" />Lembretes
            {inactive.length > 0 && (
              <Badge className="ml-2 border-destructive/40 bg-destructive/15 text-destructive">
                {inactive.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou telefone"
              className="pl-9"
            />
          </div>

          <Card className="border-border bg-card p-2 md:p-4">
            {loading ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/30" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {clients.length === 0 ? "Nenhum cliente ainda." : "Nenhum resultado."}
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((c) => {
                  const days = daysSince(c.last_visit);
                  const inactiveBadge = isInactive(c);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-background/40"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{c.name}</span>
                          {isInactive && (
                            <Badge className="border-destructive/40 bg-destructive/15 text-destructive font-normal">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {formatPhone(c.phone)} • {c.total_visits} visita
                          {c.total_visits !== 1 && "s"} • {brl(Number(c.total_spent))}
                        </div>
                      </div>
                      <div className="hidden text-right text-xs text-muted-foreground sm:block">
                        {c.last_visit ? `${days}d atrás` : "Nunca veio"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="lembretes" className="space-y-4">
          <Card className="border-border bg-card p-5">
            <h2 className="font-display text-xl tracking-wide">Mensagem padrão</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Use {`{nome}, {barbearia}, {link}`} como variáveis automáticas.
            </p>
            <Textarea
              value={reminderMsg}
              onChange={(e) => setReminderMsg(e.target.value)}
              rows={3}
              className="mt-3"
            />
          </Card>

          <Card className="border-border bg-card p-2 md:p-4">
            <div className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
              {inactive.length} cliente{inactive.length !== 1 && "s"} inativo
              {inactive.length !== 1 && "s"} (mais de {DAYS_INACTIVE} dias)
            </div>
            {inactive.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhum cliente inativo. 🎉
              </div>
            ) : (
              <div className="space-y-1">
                {inactive.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-sm font-bold text-destructive">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.last_visit ? `Última visita ${daysSince(c.last_visit)}d atrás` : "Sem visitas"}
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/55${c.phone}?text=${encodeURIComponent(buildReminder(c))}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" className="bg-success text-success-foreground hover:opacity-90">
                        <MessageCircle className="mr-1 h-3.5 w-3.5" />WhatsApp
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
          {selected && <ClientProfile client={selected} onUpdated={(u) => { setSelected(u); load(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientProfile({ client, onUpdated }: { client: Client; onUpdated: (c: Client) => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [notes, setNotes] = useState(client.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNotes(client.notes ?? "");
    (async () => {
      setLoading(true);
      const [appts, salesItems] = await Promise.all([
        supabase
          .from("appointments")
          .select("id, date, time, status, services(name, price), professionals(name)")
          .eq("client_id", client.id)
          .order("date", { ascending: false })
          .limit(50),
        supabase
          .from("sales")
          .select("id, created_at, total_amount, sale_items(name, quantity, type, unit_price)")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      setHistory(appts.data ?? []);
      const items: any[] = [];
      (salesItems.data ?? []).forEach((s: any) => {
        (s.sale_items ?? [])
          .filter((it: any) => it.type === "product")
          .forEach((it: any) => items.push({ ...it, date: s.created_at }));
      });
      setProducts(items);
      setLoading(false);
    })();
  }, [client.id]);

  const saveNotes = async () => {
    setSaving(true);
    const { error } = await supabase.from("clients").update({ notes }).eq("id", client.id);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Observações salvas");
    onUpdated({ ...client, notes });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl tracking-wide">{client.name}</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Card className="bg-background/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Visitas</div>
          <div className="font-mono text-xl font-bold">{client.total_visits}</div>
        </Card>
        <Card className="bg-background/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Gasto</div>
          <div className="font-mono text-xl font-bold text-gold">{brl(Number(client.total_spent))}</div>
        </Card>
        <Card className="bg-background/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Última</div>
          <div className="font-mono text-xs">
            {client.last_visit ? `${daysSince(client.last_visit)}d atrás` : "—"}
          </div>
        </Card>
      </div>

      <div className="space-y-1 text-sm">
        <div><span className="text-muted-foreground">Telefone:</span> {formatPhone(client.phone)}</div>
        {client.email && <div><span className="text-muted-foreground">E-mail:</span> {client.email}</div>}
      </div>

      <div className="space-y-1.5">
        <Label>Observações (alergias, preferências)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        <Button size="sm" onClick={saveNotes} disabled={saving} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="mr-1 h-3.5 w-3.5" /> Salvar</>}
        </Button>
      </div>

      <Tabs defaultValue="historico">
        <TabsList className="w-full">
          <TabsTrigger value="historico" className="flex-1">Atendimentos</TabsTrigger>
          <TabsTrigger value="produtos" className="flex-1">Produtos</TabsTrigger>
        </TabsList>
        <TabsContent value="historico" className="mt-3 space-y-1.5">
          {loading ? (
            <div className="h-20 animate-pulse rounded bg-muted/30" />
          ) : history.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Sem atendimentos.</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded border border-border bg-background/40 p-2 text-xs">
                <div className="font-mono text-gold">{formatDateBR(h.date)}</div>
                <div className="flex-1 truncate">{h.services?.name} • {h.professionals?.name}</div>
                <div className="font-mono">{brl(Number(h.services?.price ?? 0))}</div>
              </div>
            ))
          )}
        </TabsContent>
        <TabsContent value="produtos" className="mt-3 space-y-1.5">
          {loading ? (
            <div className="h-20 animate-pulse rounded bg-muted/30" />
          ) : products.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Nenhum produto comprado.</p>
          ) : (
            products.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded border border-border bg-background/40 p-2 text-xs">
                <div className="font-mono text-muted-foreground">{formatDateBR(p.date)}</div>
                <div className="flex-1 truncate">{p.name} × {p.quantity}</div>
                <div className="font-mono">{brl(Number(p.unit_price) * p.quantity)}</div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
