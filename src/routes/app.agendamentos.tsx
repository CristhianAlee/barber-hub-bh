import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { localData } from "@/lib/local-data";
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
import { ChevronLeft, ChevronRight, Plus, Loader2, Check, X, CheckCircle2, CalendarClock } from "lucide-react";
import { brl, formatPhone, onlyDigits } from "@/lib/format";
import { toast } from "sonner";
import { Checkout } from "@/components/Checkout";

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
  const [checkout, setCheckout] = useState<any>(null);
  const [reschedule, setReschedule] = useState<any>(null);

  const load = async () => {
    if (!barbershop) return;
    setLoading(true);
    const { data } = await localData
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
    const { error } = await localData.from("appointments").update({ status }).eq("id", id);
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
              <ApptRow key={a.id} a={a} onAction={updateStatus} onCheckout={() => setCheckout(a)} onReschedule={() => setReschedule(a)} />
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!checkout} onOpenChange={(o) => !o && setCheckout(null)}>
        <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-wide">Finalizar atendimento</DialogTitle>
          </DialogHeader>
          {checkout && (
            <Checkout appointment={checkout} onDone={() => { setCheckout(null); load(); }} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reschedule} onOpenChange={(o) => !o && setReschedule(null)}>
        <DialogContent className="bg-card">
          {reschedule && (
            <RescheduleDialog
              appointment={reschedule}
              onDone={() => { setReschedule(null); load(); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApptRow({ a, onAction, onCheckout, onReschedule }: any) {
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
            onClick={onCheckout}
          >
            <CheckCircle2 className="mr-1 h-3 w-3" /> Concluir
          </Button>
        )}
        {a.status !== "cancelled" && a.status !== "completed" && (
          <Button size="sm" variant="outline" onClick={onReschedule}>
            <CalendarClock className="mr-1 h-3 w-3" /> Reagendar
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
  const [hours, setHours] = useState<any[]>([]);
  const [professionalHours, setProfessionalHours] = useState<any[]>([]);
  const [professionalServices, setProfessionalServices] = useState<any[]>([]);
  const [busy, setBusy] = useState<{ time: string; duration_minutes: number; professional_id: string }[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [profId, setProfId] = useState("");
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!barbershop) return;
    (async () => {
      const [s, p, h, ph, ps] = await Promise.all([
        localData.from("services").select("id, name, price, duration_minutes").eq("barbershop_id", barbershop.id).eq("active", true),
        localData.from("professionals").select("id, name").eq("barbershop_id", barbershop.id).eq("active", true),
        localData.from("business_hours").select("day_of_week, open_time, close_time, is_closed").eq("barbershop_id", barbershop.id),
        localData.from("professional_business_hours").select("professional_id, day_of_week, open_time, close_time, is_closed").eq("barbershop_id", barbershop.id),
        localData.from("professional_services").select("professional_id, service_id").eq("barbershop_id", barbershop.id),
      ]);
      setServices(s.data ?? []);
      setProfs(p.data ?? []);
      setHours(h.data ?? []);
      setProfessionalHours(ph.data ?? []);
      setProfessionalServices(ps.data ?? []);
      if (s.data?.[0]) setServiceId(s.data[0].id);
      if (p.data?.[0]) setProfId(p.data[0].id);
    })();
  }, [barbershop]);

  // Load busy times for selected pro+date
  useEffect(() => {
    if (!barbershop || !profId) { setBusy([]); return; }
    (async () => {
      const { data } = await localData
        .from("appointments")
        .select("time, duration_minutes, professional_id")
        .eq("barbershop_id", barbershop.id)
        .eq("date", fmtDate(date))
        .eq("professional_id", profId)
        .neq("status", "cancelled");
      setBusy(data ?? []);
    })();
  }, [barbershop, profId, date]);

  // Generate available slots
  const slots = useMemo(() => {
    const svc = services.find((s) => s.id === serviceId);
    if (!barbershop || !svc) return [] as string[];
    const dow = date.getDay();
    const h = professionalHours.find((x) => x.professional_id === profId && x.day_of_week === dow) ?? hours.find((x) => x.day_of_week === dow);
    if (!h || h.is_closed) return [];
    const interval = barbershop.booking_interval_minutes ?? 30;
    const [oh, om] = h.open_time.split(":").map(Number);
    const [ch, cm] = h.close_time.split(":").map(Number);
    const start = oh * 60 + om;
    const end = ch * 60 + cm;
    const blocked = new Set<number>();
    busy.forEach((a) => {
      const [hh, mm] = a.time.split(":").map(Number);
      const startMin = hh * 60 + mm;
      for (let m = startMin; m < startMin + (a.duration_minutes ?? 30); m++) blocked.add(m);
    });
    const out: string[] = [];
    for (let t = start; t + svc.duration_minutes <= end; t += interval) {
      let conflict = false;
      for (let m = t; m < t + svc.duration_minutes; m++) {
        if (blocked.has(m)) { conflict = true; break; }
      }
      if (!conflict) {
        out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
      }
    }
    return out;
  }, [barbershop, services, serviceId, hours, professionalHours, profId, busy, date]);

  const availableProfs = serviceId
    ? profs.filter((p) => professionalServices.some((ps) => ps.professional_id === p.id && ps.service_id === serviceId))
    : profs;

  const submit = async () => {
    if (!barbershop || !serviceId || !profId || !name.trim() || onlyDigits(phone).length < 10 || !time) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);

    // Conflict guard
    const { data: clash } = await localData
      .from("appointments")
      .select("id")
      .eq("barbershop_id", barbershop.id)
      .eq("professional_id", profId)
      .eq("date", fmtDate(date))
      .eq("time", time)
      .neq("status", "cancelled");
    if (clash && clash.length > 0) {
      setSaving(false);
      return toast.error("Horário já ocupado, escolha outro");
    }

    const phoneDigits = onlyDigits(phone);
    const { data: existing } = await localData
      .from("clients")
      .select("id")
      .eq("barbershop_id", barbershop.id)
      .eq("phone", phoneDigits)
      .maybeSingle();
    let clientId = existing?.id;
    if (!clientId) {
      const { data: newClient, error: cErr } = await localData
        .from("clients")
        .insert({ barbershop_id: barbershop.id, name, phone: phoneDigits })
        .select("id")
        .single();
      if (cErr) {
        console.error("[NewAppt] erro cliente:", cErr);
        setSaving(false);
        return toast.error("Erro ao salvar cliente");
      }
      clientId = newClient.id;
    }
    const svc = services.find((s) => s.id === serviceId);
    const { error } = await localData.from("appointments").insert({
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
    if (error) {
      console.error("[NewAppt] erro agendamento:", error);
      if (error.code === "23505") return toast.error("Horário já ocupado, escolha outro");
      return toast.error(error.message);
    }
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
            <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setTime(""); }}>
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
            <Select value={profId} onValueChange={(v) => { setProfId(v); setTime(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableProfs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Horário disponível</Label>
          {slots.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              Sem horários disponíveis para este profissional nesta data.
            </p>
          ) : (
            <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTime(s)}
                  className={`rounded-md border p-2 font-mono text-sm transition ${
                    time === s ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button
          onClick={submit}
          disabled={saving || !time}
          className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </>
  );
}

function RescheduleDialog({ appointment, onDone }: { appointment: any; onDone: () => void }) {
  const { barbershop } = useAuth();
  const [nextDate, setNextDate] = useState(appointment.date ?? fmtDate(new Date()));
  const [nextTime, setNextTime] = useState(appointment.time?.slice(0, 5) ?? "");
  const [hours, setHours] = useState<any[]>([]);
  const [professionalHours, setProfessionalHours] = useState<any[]>([]);
  const [busy, setBusy] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!barbershop) return;
    Promise.all([
      localData.from("business_hours").select("day_of_week, open_time, close_time, is_closed").eq("barbershop_id", barbershop.id),
      localData.from("professional_business_hours").select("professional_id, day_of_week, open_time, close_time, is_closed").eq("barbershop_id", barbershop.id),
    ]).then(([h, ph]) => {
      setHours(h.data ?? []);
      setProfessionalHours(ph.data ?? []);
    });
  }, [barbershop]);

  useEffect(() => {
    if (!barbershop || !nextDate) return;
    localData
      .from("appointments")
      .select("id, time, duration_minutes, professional_id")
      .eq("barbershop_id", barbershop.id)
      .eq("professional_id", appointment.professional_id)
      .eq("date", nextDate)
      .neq("status", "cancelled")
      .neq("id", appointment.id)
      .then(({ data }: { data: any[] | null }) => setBusy(data ?? []));
  }, [barbershop, nextDate, appointment.id, appointment.professional_id]);

  const slots = useMemo(() => {
    if (!barbershop || !nextDate) return [] as string[];
    const dow = new Date(nextDate + "T00:00:00").getDay();
    const h = professionalHours.find((x) => x.professional_id === appointment.professional_id && x.day_of_week === dow) ?? hours.find((x) => x.day_of_week === dow);
    if (!h || h.is_closed) return [];
    const [oh, om] = h.open_time.split(":").map(Number);
    const [ch, cm] = h.close_time.split(":").map(Number);
    const start = oh * 60 + om;
    const end = ch * 60 + cm;
    const duration = appointment.duration_minutes ?? appointment.services?.duration_minutes ?? 30;
    const interval = barbershop.booking_interval_minutes ?? 30;
    const blocked = new Set<number>();
    busy.forEach((a) => {
      const [hh, mm] = a.time.split(":").map(Number);
      const startMin = hh * 60 + mm;
      for (let m = startMin; m < startMin + (a.duration_minutes ?? 30); m++) blocked.add(m);
    });
    const out: string[] = [];
    for (let t = start; t + duration <= end; t += interval) {
      let conflict = false;
      for (let m = t; m < t + duration; m++) if (blocked.has(m)) { conflict = true; break; }
      if (!conflict) out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
    }
    return out;
  }, [barbershop, nextDate, professionalHours, hours, appointment, busy]);

  const save = async () => {
    if (!barbershop || !nextDate || !nextTime) return toast.error("Escolha data e horário");
    setSaving(true);
    const { data: clash } = await localData
      .from("appointments")
      .select("id")
      .eq("barbershop_id", barbershop.id)
      .eq("professional_id", appointment.professional_id)
      .eq("date", nextDate)
      .eq("time", nextTime)
      .neq("status", "cancelled")
      .neq("id", appointment.id);
    if (clash && clash.length > 0) {
      setSaving(false);
      return toast.error("Horário já ocupado, escolha outro");
    }
    const { error } = await localData
      .from("appointments")
      .update({ date: nextDate, time: nextTime, status: "confirmed" })
      .eq("id", appointment.id);
    setSaving(false);
    if (error) return toast.error(error.code === "23505" ? "Horário já ocupado, escolha outro" : error.message);
    toast.success("Agendamento reagendado");
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl tracking-wide">Reagendar atendimento</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background/40 p-3 text-sm">
          <div className="font-medium">{appointment.clients?.name}</div>
          <div className="text-xs text-muted-foreground">{appointment.services?.name} • {appointment.professionals?.name}</div>
        </div>
        <div className="space-y-1.5">
          <Label>Nova data</Label>
          <Input type="date" value={nextDate} onChange={(e) => { setNextDate(e.target.value); setNextTime(""); }} />
        </div>
        <div className="space-y-1.5">
          <Label>Novo horário</Label>
          {slots.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">Sem horários disponíveis nesta data.</p>
          ) : (
            <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto">
              {slots.map((s) => (
                <button key={s} type="button" onClick={() => setNextTime(s)} className={`rounded-md border p-2 font-mono text-sm transition ${nextTime === s ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/40"}`}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button onClick={save} disabled={saving || !nextTime} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar reagendamento"}
        </Button>
      </div>
    </>
  );
}
