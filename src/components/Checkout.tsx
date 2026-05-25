import { useEffect, useMemo, useState } from "react";
import { localData } from "@/lib/local-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { brl } from "@/lib/format";
import { Loader2, Sparkles, Plus, X } from "lucide-react";
import { toast } from "sonner";

type PaymentMethod = "cash" | "pix" | "debit" | "credit";

type Appt = {
  id: string;
  barbershop_id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  services?: { name: string; price: number };
  clients?: { name: string };
};

type Service = { id: string; name: string; price: number };
type Product = { id: string; name: string; price: number; stock_quantity: number };

export function Checkout({ appointment, onDone }: { appointment: Appt; onDone: () => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [extraServices, setExtraServices] = useState<Set<string>>(new Set());
  const [orderbumpProducts, setOrderbumpProducts] = useState<Map<string, number>>(new Map());
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([
        localData.from("services").select("id, name, price").eq("barbershop_id", appointment.barbershop_id).eq("active", true),
        localData.from("products").select("id, name, price, stock_quantity").eq("barbershop_id", appointment.barbershop_id).eq("active", true).gt("stock_quantity", 0).limit(3),
      ]);
      setServices((s.data ?? []).filter((x: any) => x.id !== appointment.service_id));
      setProducts((p.data as Product[]) ?? []);
      setLoading(false);
    })();
  }, [appointment.barbershop_id, appointment.service_id]);

  const baseService = appointment.services;
  const total = useMemo(() => {
    let t = Number(baseService?.price ?? 0);
    services.forEach((s) => extraServices.has(s.id) && (t += Number(s.price)));
    products.forEach((p) => {
      const q = orderbumpProducts.get(p.id) ?? 0;
      t += Number(p.price) * q;
    });
    return t;
  }, [baseService, services, extraServices, products, orderbumpProducts]);

  const finalize = async () => {
    setSubmitting(true);
    try {
      // 1. Create sale
      const { data: sale, error: saleErr } = await localData
        .from("sales")
        .insert({
          barbershop_id: appointment.barbershop_id,
          client_id: appointment.client_id,
          professional_id: appointment.professional_id,
          appointment_id: appointment.id,
          payment_method: payment,
          total_amount: total,
        })
        .select("id")
        .single();
      if (saleErr || !sale) {
        console.error("[Checkout] Falha ao criar venda:", saleErr);
        setSubmitting(false);
        return toast.error(`Erro ao registrar venda: ${saleErr?.message ?? "desconhecido"}`);
      }

      // 2. Create sale_items
      const items: any[] = [];
      if (baseService) {
        items.push({
          sale_id: sale.id, type: "service", item_id: appointment.service_id,
          name: baseService.name, quantity: 1, unit_price: Number(baseService.price),
        });
      }
      services.filter((s) => extraServices.has(s.id)).forEach((s) => {
        items.push({ sale_id: sale.id, type: "service", item_id: s.id, name: s.name, quantity: 1, unit_price: Number(s.price) });
      });
      products.forEach((p) => {
        const q = orderbumpProducts.get(p.id) ?? 0;
        if (q > 0) items.push({ sale_id: sale.id, type: "product", item_id: p.id, name: p.name, quantity: q, unit_price: Number(p.price) });
      });
      if (items.length > 0) {
        const { error: itemsErr } = await localData.from("sale_items").insert(items);
        if (itemsErr) console.error("[Checkout] Falha ao salvar itens:", itemsErr);
      }

      // 3. Financial entry
      const { error: finErr } = await localData.from("financial_entries").insert({
        barbershop_id: appointment.barbershop_id,
        type: "income",
        category: "Atendimento",
        description: `${appointment.clients?.name ?? "Cliente"} — ${baseService?.name ?? ""}`,
        amount: total,
        date: new Date().toISOString().slice(0, 10),
        payment_method: payment,
        sale_id: sale.id,
      });
      if (finErr) console.error("[Checkout] Falha ao lançar no financeiro:", finErr);

      // 4. Stock decrement
      await Promise.all(
        products.map(async (p) => {
          const q = orderbumpProducts.get(p.id) ?? 0;
          if (q > 0) {
            const { error: stockErr } = await localData.from("products")
              .update({ stock_quantity: p.stock_quantity - q }).eq("id", p.id);
            if (stockErr) console.error("[Checkout] Falha ao baixar estoque:", stockErr);
            await localData.from("stock_movements").insert({
              product_id: p.id, type: "out", quantity: q, reason: "Venda no atendimento",
            });
          }
        })
      );

      // 5. Update appointment
      const { error: apptErr } = await localData.from("appointments")
        .update({ status: "completed" }).eq("id", appointment.id);
      if (apptErr) console.error("[Checkout] Falha ao concluir agendamento:", apptErr);

      // 6. Update client totals
      const { data: client } = await localData
        .from("clients").select("total_visits, total_spent")
        .eq("id", appointment.client_id).maybeSingle();
      if (client) {
        await localData.from("clients").update({
          total_visits: (client.total_visits ?? 0) + 1,
          total_spent: Number(client.total_spent ?? 0) + total,
          last_visit: new Date().toISOString(),
        }).eq("id", appointment.client_id);
      }

      toast.success(`Atendimento finalizado — ${brl(total)}`);
      onDone();
    } catch (err: any) {
      console.error("[Checkout] Erro inesperado:", err);
      toast.error(`Erro inesperado: ${err?.message ?? "tente novamente"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePayment = (m: PaymentMethod) => setPayment(m);
  const incProduct = (id: string, delta: number) => {
    const m = new Map(orderbumpProducts);
    const next = Math.max(0, (m.get(id) ?? 0) + delta);
    if (next === 0) m.delete(id); else m.set(id, next);
    setOrderbumpProducts(m);
  };

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  const paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: "cash", label: "Dinheiro" }, { value: "pix", label: "PIX" },
    { value: "debit", label: "Débito" }, { value: "credit", label: "Crédito" },
  ];

  return (
    <div className="space-y-4">
      {/* Cliente */}
      <div className="rounded-lg border border-border bg-background/40 p-3 text-sm">
        <div className="text-xs text-muted-foreground">Cliente</div>
        <div className="font-medium">{appointment.clients?.name}</div>
      </div>

      {/* Serviço base */}
      <div>
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Serviço agendado</div>
        <div className="flex items-center justify-between rounded-lg border border-gold/30 bg-gold/5 p-3">
          <div className="font-medium">{baseService?.name}</div>
          <div className="font-mono text-gold">{brl(Number(baseService?.price ?? 0))}</div>
        </div>
      </div>

      {/* Extra services */}
      {services.length > 0 && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Adicionar serviços</div>
          <div className="space-y-1.5">
            {services.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background/40 p-2.5 text-sm hover:border-gold/40">
                <Checkbox
                  checked={extraServices.has(s.id)}
                  onCheckedChange={(v) => {
                    const n = new Set(extraServices);
                    v ? n.add(s.id) : n.delete(s.id);
                    setExtraServices(n);
                  }}
                />
                <span className="flex-1">{s.name}</span>
                <span className="font-mono text-muted-foreground">{brl(Number(s.price))}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Orderbump */}
      {products.length > 0 && (
        <Card className="border-gold/40 bg-gradient-to-br from-gold/15 to-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h3 className="font-display text-lg tracking-wide text-gold">Aproveite e leve também:</h3>
          </div>
          <div className="space-y-2">
            {products.map((p) => {
              const q = orderbumpProducts.get(p.id) ?? 0;
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-lg bg-background/40 p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="font-mono text-xs text-gold">{brl(Number(p.price))}</div>
                  </div>
                  {q === 0 ? (
                    <Button size="sm" onClick={() => incProduct(p.id, 1)} className="bg-gold/20 text-gold hover:bg-gold/30">
                      <Plus className="mr-1 h-3.5 w-3.5" />Adicionar
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => incProduct(p.id, -1)}><X className="h-3 w-3" /></Button>
                      <span className="w-8 text-center font-mono">{q}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => incProduct(p.id, 1)} disabled={q >= p.stock_quantity}><Plus className="h-3 w-3" /></Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Pagamento */}
      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Forma de pagamento</Label>
        <div className="grid grid-cols-4 gap-2">
          {paymentOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => togglePayment(o.value)}
              className={`rounded-lg border p-2 text-xs transition ${
                payment === o.value ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-lg border border-gold/40 bg-gold/10 p-4">
        <span className="text-sm uppercase tracking-wider text-muted-foreground">Total</span>
        <span className="font-mono text-2xl font-bold text-gold">{brl(total)}</span>
      </div>

      <Button
        onClick={finalize}
        disabled={submitting}
        className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold"
        size="lg"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalizar atendimento"}
      </Button>
    </div>
  );
}
