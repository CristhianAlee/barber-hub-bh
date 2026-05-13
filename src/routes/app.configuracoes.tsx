import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Loader2, Plus, Settings, Trash2 } from "lucide-react";
import { brl, formatPhone } from "@/lib/format";

export const Route = createFileRoute("/app/configuracoes")({
  component: Configuracoes,
});

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function Configuracoes() {
  const { barbershop, refreshBarbershop } = useAuth();
  const [tab, setTab] = useState<"barbearia" | "horarios" | "profissionais" | "servicos">("barbearia");

  if (!barbershop) return null;

  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/agendar/${barbershop.slug}` : "";

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl tracking-wide md:text-4xl">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua barbearia, horários, equipe e serviços</p>
      </div>

      {/* Public link */}
      <Card className="border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg tracking-wide text-gold">Seu link público de agendamento</h3>
            <p className="mt-1 text-xs text-muted-foreground">Envie este link para seus clientes agendarem sozinhos.</p>
            <div className="mt-2 break-all rounded-md bg-background/60 px-3 py-2 font-mono text-xs">{publicUrl}</div>
          </div>
          <Button
            size="sm"
            className="bg-gradient-gold text-gold-foreground hover:opacity-90"
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              toast.success("Link copiado!");
            }}
          >
            <Copy className="mr-2 h-3.5 w-3.5" /> Copiar
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {(["barbearia", "horarios", "profissionais", "servicos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm transition ${
              tab === t
                ? "border-b-2 border-gold text-gold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "barbearia" ? "Barbearia" : t === "horarios" ? "Horários" : t === "profissionais" ? "Profissionais" : "Serviços"}
          </button>
        ))}
      </div>

      {tab === "barbearia" && <BarbershopForm onSaved={refreshBarbershop} />}
      {tab === "horarios" && <BusinessHours />}
      {tab === "profissionais" && <ProfessionalsTab />}
      {tab === "servicos" && <ServicesTab />}
    </div>
  );
}

function BarbershopForm({ onSaved }: { onSaved: () => void }) {
  const { barbershop } = useAuth();
  const [name, setName] = useState(barbershop?.name ?? "");
  const [phone, setPhone] = useState(formatPhone(barbershop?.phone ?? ""));
  const [address, setAddress] = useState(barbershop?.address ?? "");
  const [interval, setInterval] = useState(String(barbershop?.booking_interval_minutes ?? 30));
  const [maxAdvance, setMaxAdvance] = useState(String(barbershop?.max_advance_days ?? 30));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!barbershop) return;
    setSaving(true);
    const { error } = await supabase
      .from("barbershops")
      .update({
        name,
        phone: phone.replace(/\D/g, ""),
        address,
        booking_interval_minutes: Number(interval),
        max_advance_days: Number(maxAdvance),
      })
      .eq("id", barbershop.id);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Salvo!");
    onSaved();
  };

  return (
    <Card className="border-border bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp</Label>
          <Input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Endereço</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Intervalo entre agendamentos</Label>
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 min</SelectItem>
              <SelectItem value="30">30 min</SelectItem>
              <SelectItem value="45">45 min</SelectItem>
              <SelectItem value="60">60 min</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Antecedência máxima</Label>
          <Select value={maxAdvance} onValueChange={setMaxAdvance}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="15">15 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={save} disabled={saving} className="mt-5 bg-gradient-gold text-gold-foreground hover:opacity-90">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
      </Button>
    </Card>
  );
}

function BusinessHours() {
  const { barbershop } = useAuth();
  const [hours, setHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barbershop) return;
    (async () => {
      const { data } = await supabase
        .from("business_hours")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("day_of_week");
      setHours(data ?? []);
      setLoading(false);
    })();
  }, [barbershop]);

  const update = (idx: number, patch: any) => {
    const c = [...hours];
    c[idx] = { ...c[idx], ...patch };
    setHours(c);
  };

  const save = async () => {
    const { error } = await supabase
      .from("business_hours")
      .upsert(hours.map((h) => ({ ...h })), { onConflict: "barbershop_id,day_of_week" });
    if (error) return toast.error("Erro ao salvar");
    toast.success("Horários atualizados");
  };

  if (loading) return <div className="text-sm text-muted-foreground">Carregando...</div>;
  return (
    <Card className="border-border bg-card p-5">
      <div className="space-y-3">
        {hours.map((h, i) => (
          <div key={h.day_of_week} className="flex flex-wrap items-center gap-3 border-b border-border pb-3 last:border-0">
            <div className="w-24 text-sm font-medium">{DAYS[h.day_of_week]}</div>
            <div className="flex items-center gap-2">
              <Switch checked={!h.is_closed} onCheckedChange={(v) => update(i, { is_closed: !v })} />
              <span className="text-xs text-muted-foreground">{h.is_closed ? "Fechado" : "Aberto"}</span>
            </div>
            {!h.is_closed && (
              <>
                <Input type="time" value={h.open_time?.slice(0, 5)} onChange={(e) => update(i, { open_time: e.target.value })} className="w-28" />
                <span className="text-muted-foreground">às</span>
                <Input type="time" value={h.close_time?.slice(0, 5)} onChange={(e) => update(i, { close_time: e.target.value })} className="w-28" />
              </>
            )}
          </div>
        ))}
      </div>
      <Button onClick={save} className="mt-5 bg-gradient-gold text-gold-foreground hover:opacity-90">Salvar horários</Button>
    </Card>
  );
}

function ProfessionalsTab() {
  const { barbershop } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    if (!barbershop) return;
    const { data } = await supabase
      .from("professionals")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .order("created_at");
    setList(data ?? []);
  };
  useEffect(() => { load(); }, [barbershop]); // eslint-disable-line

  const add = async () => {
    if (!name.trim() || !barbershop) return toast.error("Informe o nome");
    if (phone.replace(/\D/g, "").length < 10) return toast.error("Telefone obrigatório");
    const { error } = await supabase
      .from("professionals")
      .insert({ barbershop_id: barbershop.id, name, phone: phone.replace(/\D/g, "") });
    if (error) return toast.error(error.message);
    setName(""); setPhone("");
    load();
  };
  const toggle = async (id: string, active: boolean) => {
    await supabase.from("professionals").update({ active }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Remover profissional?")) return;
    await supabase.from("professionals").delete().eq("id", id);
    load();
  };

  return (
    <Card className="border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
        <Input className="md:col-span-5" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Input className="md:col-span-5" placeholder="Telefone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
        <Button className="md:col-span-2 bg-gradient-gold text-gold-foreground hover:opacity-90" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {list.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="min-w-0">
              <div className="font-medium">{p.name}</div>
              {p.phone && <div className="text-xs text-muted-foreground">{formatPhone(p.phone)}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setEditing(p)} title="Configurar horários e serviços">
                <Settings className="h-4 w-4 text-gold" />
              </Button>
              <div className="flex items-center gap-2">
                <Switch checked={p.active} onCheckedChange={(v) => toggle(p.id, v)} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-sm text-muted-foreground">Nenhum profissional cadastrado.</div>}
      </div>
      {editing && (
        <ProfessionalConfigDialog
          professional={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}

function ProfessionalConfigDialog({ professional, onClose }: { professional: any; onClose: () => void }) {
  const { barbershop } = useAuth();
  const [tab, setTab] = useState<"horarios" | "servicos">("horarios");
  const [hours, setHours] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [linkedServiceIds, setLinkedServiceIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!barbershop) return;
    (async () => {
      setLoading(true);
      const [pHoursRes, bHoursRes, servicesRes, linksRes] = await Promise.all([
        supabase.from("professional_business_hours").select("*").eq("professional_id", professional.id),
        supabase.from("business_hours").select("*").eq("barbershop_id", barbershop.id).order("day_of_week"),
        supabase.from("services").select("id, name, price, active").eq("barbershop_id", barbershop.id).eq("active", true).order("name"),
        supabase.from("professional_services").select("service_id").eq("professional_id", professional.id),
      ]);
      const pHours = pHoursRes.data ?? [];
      const bHours = bHoursRes.data ?? [];
      // Build hours per day, falling back to barbershop hours
      const merged = Array.from({ length: 7 }, (_, dow) => {
        const ph = pHours.find((h: any) => h.day_of_week === dow);
        const bh = bHours.find((h: any) => h.day_of_week === dow);
        return {
          day_of_week: dow,
          open_time: (ph?.open_time ?? bh?.open_time ?? "09:00:00").slice(0, 5),
          close_time: (ph?.close_time ?? bh?.close_time ?? "19:00:00").slice(0, 5),
          is_closed: ph?.is_closed ?? bh?.is_closed ?? false,
          custom: !!ph,
        };
      });
      setHours(merged);
      setServices(servicesRes.data ?? []);
      setLinkedServiceIds(new Set((linksRes.data ?? []).map((l: any) => l.service_id)));
      setLoading(false);
    })();
  }, [barbershop, professional.id]);

  const updateHour = (idx: number, patch: any) => {
    const c = [...hours];
    c[idx] = { ...c[idx], ...patch, custom: true };
    setHours(c);
  };
  const resetDay = async (dow: number) => {
    if (!barbershop) return;
    await supabase
      .from("professional_business_hours")
      .delete()
      .eq("professional_id", professional.id)
      .eq("day_of_week", dow);
    const { data: bh } = await supabase.from("business_hours").select("*").eq("barbershop_id", barbershop.id).eq("day_of_week", dow).maybeSingle();
    const c = [...hours];
    c[dow] = {
      day_of_week: dow,
      open_time: (bh?.open_time ?? "09:00:00").slice(0, 5),
      close_time: (bh?.close_time ?? "19:00:00").slice(0, 5),
      is_closed: bh?.is_closed ?? false,
      custom: false,
    };
    setHours(c);
    toast.success("Dia restaurado para horário da barbearia");
  };

  const toggleService = (id: string) => {
    const c = new Set(linkedServiceIds);
    if (c.has(id)) c.delete(id); else c.add(id);
    setLinkedServiceIds(c);
  };

  const save = async () => {
    if (!barbershop) return;
    setSaving(true);
    try {
      // Save custom hours (only those marked custom)
      const customRows = hours.filter((h) => h.custom).map((h) => ({
        barbershop_id: barbershop.id,
        professional_id: professional.id,
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
        is_closed: h.is_closed,
      }));
      if (customRows.length > 0) {
        // Delete existing then insert (avoids missing unique constraint issues)
        await supabase.from("professional_business_hours").delete().eq("professional_id", professional.id);
        const { error: hErr } = await supabase.from("professional_business_hours").insert(customRows);
        if (hErr) throw hErr;
      }

      // Save service links
      await supabase.from("professional_services").delete().eq("professional_id", professional.id);
      const links = Array.from(linkedServiceIds).map((sid) => ({
        barbershop_id: barbershop.id,
        professional_id: professional.id,
        service_id: sid,
      }));
      if (links.length > 0) {
        const { error: sErr } = await supabase.from("professional_services").insert(links);
        if (sErr) throw sErr;
      }
      toast.success("Configurações salvas");
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">Configurar {professional.name}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 border-b border-border">
          {(["horarios", "servicos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm transition ${tab === t ? "border-b-2 border-gold text-gold" : "text-muted-foreground"}`}
            >
              {t === "horarios" ? "Horários" : "Serviços"}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="space-y-2 py-4">
            {[0,1,2,3].map((i) => <div key={i} className="h-12 animate-pulse rounded-md bg-muted/30" />)}
          </div>
        ) : tab === "horarios" ? (
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Defina horários específicos deste profissional. Dias sem personalização usam o horário da barbearia.
            </p>
            {hours.map((h, i) => (
              <div key={h.day_of_week} className="flex flex-wrap items-center gap-2 border-b border-border pb-2 last:border-0">
                <div className="w-20 text-sm font-medium">{DAYS[h.day_of_week]}</div>
                <div className="flex items-center gap-1.5">
                  <Switch checked={!h.is_closed} onCheckedChange={(v) => updateHour(i, { is_closed: !v })} />
                  <span className="text-xs text-muted-foreground">{h.is_closed ? "Folga" : "Trabalha"}</span>
                </div>
                {!h.is_closed && (
                  <>
                    <Input type="time" value={h.open_time} onChange={(e) => updateHour(i, { open_time: e.target.value })} className="w-24" />
                    <span className="text-xs text-muted-foreground">às</span>
                    <Input type="time" value={h.close_time} onChange={(e) => updateHour(i, { close_time: e.target.value })} className="w-24" />
                  </>
                )}
                {h.custom && (
                  <Button variant="ghost" size="sm" onClick={() => resetDay(h.day_of_week)} className="ml-auto text-xs">
                    Usar padrão
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 py-2">
            <p className="text-xs text-muted-foreground">
              Marque os serviços que este profissional realiza. Se nenhum for marcado, ele realiza todos.
            </p>
            {services.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 hover:border-gold/40">
                <div className="flex items-center gap-3">
                  <Checkbox checked={linkedServiceIds.has(s.id)} onCheckedChange={() => toggleService(s.id)} />
                  <div>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{brl(Number(s.price))}</div>
                  </div>
                </div>
              </label>
            ))}
            {services.length === 0 && <div className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</div>}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ServicesTab() {
  const { barbershop } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", duration: 30, price: 0 });

  const load = async () => {
    if (!barbershop) return;
    const { data } = await supabase
      .from("services").select("*").eq("barbershop_id", barbershop.id).order("created_at");
    setList(data ?? []);
  };
  useEffect(() => { load(); }, [barbershop]); // eslint-disable-line

  const add = async () => {
    if (!form.name.trim() || !barbershop) return;
    const { error } = await supabase.from("services").insert({
      barbershop_id: barbershop.id,
      name: form.name,
      duration_minutes: form.duration,
      price: form.price,
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", duration: 30, price: 0 });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Remover serviço?")) return;
    await supabase.from("services").delete().eq("id", id);
    load();
  };
  const toggle = async (id: string, active: boolean) => {
    await supabase.from("services").update({ active }).eq("id", id);
    load();
  };

  return (
    <Card className="border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
        <Input className="md:col-span-5" placeholder="Nome do serviço" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input className="md:col-span-3" type="number" placeholder="Min" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
        <Input className="md:col-span-2" type="number" placeholder="R$" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        <Button className="md:col-span-2 bg-gradient-gold text-gold-foreground hover:opacity-90" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {list.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">
                {s.duration_minutes} min • {brl(Number(s.price))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={s.active} onCheckedChange={(v) => toggle(s.id, v)} />
              <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</div>}
      </div>
    </Card>
  );
}
