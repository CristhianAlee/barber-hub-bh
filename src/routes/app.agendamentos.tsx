import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Plus, Loader2, Check, X } from "lucide-react";
import { brl, formatPhone, onlyDigits } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/agendamentos")({
  component: AgendamentosPage,
});

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const dayLabel = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(d);

function AgendamentosPage() {
  const { barbershop } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [appts, setAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!barbershop) return;
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select(
        "id, time, status, notes, duration_minutes, professional_id, client_id, service_id, clients(name, phone), services(name, price, duration_minutes), professionals(name)"
      )
      .eq("barbershop_id", barbershop.id)
      .eq("date", fmtDate(date))
      .order("time");
    setAppts(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, barbershop]);

  const updateStatus = async (id: string, status: "pending" | "confirmed" | "completed" | "cancelled") => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success("Status atualizado");
    load();
  };

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide md:text-4xl">Agendamentos</h1>
          <p className="text-sm capitalize text-muted-foreground">{dayLabel(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setDate(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <NewAppointmentDialog
                date={date}
                onCreated={() => {
                  setOpen(false);
                  load();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border bg-card p-4 md:p-6">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/30" />
            ))}
          </div>
        ) : appts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            Nenhum agendamento para este dia.
          </div>
        ) : (
          <div className="space-y-2">
            {appts.map((a) => (
              <ApptRow key={a.id} a={a} onAction={updateStatus} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ApptRow({ a, onAction }: any) {
  const statusMap: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "bg-muted text-muted-foreground border-border" },
    confirmed: { label: "Confirmado", cls: "bg-gold/15 text-gold border-gold/30" },
    completed: { label: "Concluído", cls: "bg-success/15 text-success border-success/30" },
    cancelled: { label: "Cancelado", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  };
  const m = statusMap[a.status] ?? statusMap.pending;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/40 p-3">
      <div className="rounded-md bg-gold/10 px-3 py-2 font-mono text-base text-gold">
        {a.time?.slice(0, 5)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{a.clients?.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {a.services?.name} • {a.professionals?.name} • {brl(Number(a.services?.price || 0))}
        </div>
        {a.clients?.phone && (
          <div className="text-xs text-muted-foreground">{formatPhone(a.clients.phone)}</div>
        )}
      </div>
      <Badge className={`border ${m.cls} font-normal`}>{m.label}</Badge>
      <div className="flex w-full gap-2 md:w-auto">
        {a.status === "pending" && (
          <Button size="sm" variant="outline" onClick={() => onAction(a.id, "confirmed")}>
            <Check className="mr-1 h-3 w-3" /> Confirmar
          </Button>
        )}
        {a.status === "confirmed" && (
          <Button
            size="sm"
            className="bg-success text-success-foreground hover:opacity-90"
            onClick={() => onAction(a.id, "completed")}
          >
            <Check className="mr-1 h-3 w-3" /> Concluir
          </Button>
        )}
        {a.status !== "cancelled" && a.status !== "completed" && (
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => onAction(a.id, "cancelled")}
          >
            <X className="mr-1 h-3 w-3" /> Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

function NewAppointmentDialog({ date, onCreated }: { date: Date; onCreated: () => void }) {
  const { barbershop } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [profId, setProfId] = useState("");
  const [time, setTime] = useState("09:00");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!barbershop) return;
    (async () => {
      const [s, p] = await Promise.all([
        supabase.from("services").select("*").eq("barbershop_id", barbershop.id).eq("active", true),
        supabase.from("professionals").select("*").eq("barbershop_id", barbershop.id).eq("active", true),
      ]);
      setServices(s.data ?? []);
      setProfs(p.data ?? []);
      if (s.data?.[0]) setServiceId(s.data[0].id);
      if (p.data?.[0]) setProfId(p.data[0].id);
    })();
  }, [barbershop]);

  const submit = async () => {
    if (!barbershop || !serviceId || !profId || !name.trim() || onlyDigits(phone).length < 10) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    // Find or create client by phone
    const phoneDigits = onlyDigits(phone);
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("barbershop_id", barbershop.id)
      .eq("phone", phoneDigits)
      .maybeSingle();
    let clientId = existing?.id;
    if (!clientId) {
      const { data: newClient, error: cErr } = await supabase
        .from("clients")
        .insert({ barbershop_id: barbershop.id, name, phone: phoneDigits })
        .select("id")
        .single();
      if (cErr) {
        setSaving(false);
        return toast.error("Erro ao salvar cliente");
      }
      clientId = newClient.id;
    }
    const svc = services.find((s) => s.id === serviceId);
    const { error } = await supabase.from("appointments").insert({
      barbershop_id: barbershop.id,
      professional_id: profId,
      client_id: clientId,
      service_id: serviceId,
      date: fmtDate(date),
      time,
      duration_minutes: svc?.duration_minutes ?? 30,
      status: "confirmed",
      notes: notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Agendamento criado");
    onCreated();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl tracking-wide">Novo agendamento</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Cliente — telefone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(00) 00000-0000"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Nome do cliente</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Serviço</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {brl(Number(s.price))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Profissional</Label>
            <Select value={profId} onValueChange={setProfId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {profs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Horário</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button
          onClick={submit}
          disabled={saving}
          className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </>
  );
}
