import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabasePublic } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/hooks/useLanguage";
import { brl, formatPhone, onlyDigits, formatDateBR } from "@/lib/format";
import { publicBookingSchema } from "@/lib/validationSchemas";
import { useFormValidation } from "@/hooks/useFormValidation";
import { Loader2, Check, ChevronLeft, MapPin, Scissors, User, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agendar/$slug")({
  component: PublicBooking,
});

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const timeToMinutes = (value: string) => {
  const [hh, mm] = value.split(":").map(Number);
  return hh * 60 + mm;
};

function LangToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
      <button
        onClick={() => setLanguage("pt")}
        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
          language === "pt" ? "bg-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        PT
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
          language === "en" ? "bg-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}

function PublicBooking() {
  const { slug } = useParams({ from: "/agendar/$slug" });
  const { t } = useLanguage();
  const [bs, setBs] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [professionalHours, setProfessionalHours] = useState<any[]>([]);
  const [professionalServices, setProfessionalServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState("");
  const [profId, setProfId] = useState("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<any>(null);
  const { errors, validate, clearError } = useFormValidation(publicBookingSchema);

  useEffect(() => {
    (async () => {
      try {
        const { data: b, error: bErr } = await supabasePublic
          .from("public_barbershops")
          .select("id, name, slug, phone, address, logo_url, booking_interval_minutes, max_advance_days")
          .eq("slug", slug)
          .maybeSingle();
        if (bErr) console.error("[Agendar] erro barbearia:", bErr);
        if (!b) { setLoading(false); return; }
        setBs(b);
        const [s, p, h, ph, ps] = await Promise.all([
          supabasePublic.from("services").select("id, name, price, duration_minutes").eq("barbershop_id", b.id).eq("active", true).order("price"),
          supabasePublic.from("public_professionals").select("id, name").eq("barbershop_id", b.id),
          supabasePublic.from("business_hours").select("day_of_week, open_time, close_time, is_closed").eq("barbershop_id", b.id),
          supabasePublic.from("professional_business_hours").select("professional_id, day_of_week, open_time, close_time, is_closed").eq("barbershop_id", b.id),
          supabasePublic.from("professional_services").select("professional_id, service_id").eq("barbershop_id", b.id),
        ]);
        setServices(s.data ?? []);
        setProfs(p.data ?? []);
        setHours(h.data ?? []);
        setProfessionalHours(ph.data ?? []);
        setProfessionalServices(ps.data ?? []);
      } catch (e) {
        console.error("[Agendar] erro carregar:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const service = services.find((s) => s.id === serviceId);
  const prof = profs.find((p) => p.id === profId);

  const professionalsForService = useMemo(() => {
    if (!serviceId) return profs;
    return profs.filter((p) => {
      const links = professionalServices.filter((ps) => ps.professional_id === p.id);
      if (links.length === 0) return true;
      return links.some((ps) => ps.service_id === serviceId);
    });
  }, [profs, professionalServices, serviceId]);

  const getHoursForProfessional = (professionalId: string, dow: number) =>
    professionalHours.find((x) => x.professional_id === professionalId && x.day_of_week === dow) ??
    hours.find((x) => x.day_of_week === dow);

  const availableDates = useMemo(() => {
    if (!bs) return [];
    const out: { date: string; label: string; closed: boolean }[] = [];
    for (let i = 0; i < (bs.max_advance_days ?? 30); i++) {
      const d = addDays(new Date(), i);
      const dow = d.getDay();
      const h = profId
        ? (professionalHours.find((x) => x.professional_id === profId && x.day_of_week === dow) ?? hours.find((x) => x.day_of_week === dow))
        : hours.find((x) => x.day_of_week === dow);
      out.push({
        date: fmtDate(d),
        label: new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(d),
        closed: !h || h.is_closed,
      });
    }
    return out;
  }, [bs, hours, professionalHours, profId]);

  const [slots, setSlots] = useState<string[]>([]);
  useEffect(() => {
    if (!bs || !date || !service) { setSlots([]); return; }
    (async () => {
      const dow = new Date(date + "T00:00:00").getDay();
      const candidateProfs = profId
        ? professionalsForService.filter((p) => p.id === profId)
        : professionalsForService;
      if (candidateProfs.length === 0) { setSlots([]); return; }

      const interval = bs.booking_interval_minutes ?? 30;
      const { data: existing } = await supabasePublic
        .rpc("get_booked_slots", { p_barbershop_id: bs.id, p_date: date });

      const out = new Set<string>();
      const now = new Date();
      const isToday = date === fmtDate(now);
      const nowMin = now.getHours() * 60 + now.getMinutes();

      candidateProfs.forEach((candidate) => {
        const h = getHoursForProfessional(candidate.id, dow);
        if (!h || h.is_closed) return;
        const [oh, om] = h.open_time.split(":").map(Number);
        const [ch, cm] = h.close_time.split(":").map(Number);
        const start = oh * 60 + om;
        const end = ch * 60 + cm;
        const blocked = new Set<number>();
        (existing ?? []).filter((a: any) => a.professional_id === candidate.id).forEach((a: any) => {
          const [hh, mm] = a.time.split(":").map(Number);
          const startMin = hh * 60 + mm;
          for (let m = startMin; m < startMin + (a.duration_minutes ?? 30); m++) blocked.add(m);
        });
        for (let t = start; t + service.duration_minutes <= end; t += interval) {
          if (isToday && t <= nowMin) continue;
          let conflict = false;
          for (let m = t; m < t + service.duration_minutes; m++) {
            if (blocked.has(m)) { conflict = true; break; }
          }
          if (!conflict) {
            const hh = String(Math.floor(t / 60)).padStart(2, "0");
            const mm = String(t % 60).padStart(2, "0");
            out.add(`${hh}:${mm}`);
          }
        }
      });
      setSlots(Array.from(out).sort());
    })();
  }, [bs, date, service, profId, hours, professionalHours, professionalsForService]);

  const submit = async () => {
    if (!bs || !service || !date || !time || !name.trim() || onlyDigits(phone).length < 10) return;
    if (!validate({ name, phone: onlyDigits(phone), email, notes })) return;

    let finalProfId = profId;
    if (!finalProfId) {
      const dow = new Date(date + "T00:00:00").getDay();
      const { data: existing } = await supabasePublic
        .rpc("get_booked_slots", { p_barbershop_id: bs.id, p_date: date });
      finalProfId = professionalsForService.find((candidate) => {
        const h = getHoursForProfessional(candidate.id, dow);
        if (!h || h.is_closed) return false;
        const start = timeToMinutes(time);
        const open = timeToMinutes(h.open_time);
        const close = timeToMinutes(h.close_time);
        if (start < open || start + service.duration_minutes > close) return false;
        return !(existing ?? []).filter((a: any) => a.professional_id === candidate.id).some((a: any) => {
          const apptStart = timeToMinutes(a.time);
          const apptEnd = apptStart + (a.duration_minutes ?? 30);
          return start < apptEnd && start + service.duration_minutes > apptStart;
        });
      })?.id ?? "";
    }
    if (!finalProfId) return toast.error("Nenhum profissional disponível");

    setSubmitting(true);

    const { data: booked } = await supabasePublic
      .rpc("get_booked_slots", { p_barbershop_id: bs.id, p_date: date });
    const clash = (booked ?? []).filter(
      (a) => a.professional_id === finalProfId && String(a.time).slice(0, 5) === time,
    );
    if (clash.length > 0) {
      setSubmitting(false);
      setTime("");
      return toast.error("Horário já ocupado, escolha outro");
    }

    const phoneDigits = onlyDigits(phone);

    // Insert via Edge Function public-booking (service_role) — não usa mais
    // acesso anon direto às tabelas clients/appointments.
    const { data, error } = await supabasePublic.functions.invoke("public-booking", {
      body: {
        barbershop_id: bs.id,
        professional_id: finalProfId,
        service_id: service.id,
        date,
        time,
        duration_minutes: service.duration_minutes,
        client_name: name,
        client_phone: phoneDigits,
        client_email: email || null,
        notes: notes || null,
      },
    });

    if (error || !data?.success) {
      setSubmitting(false);
      // Extrai a mensagem amigável retornada pela função (corpo do erro HTTP).
      let msg = "Não foi possível agendar. Tente novamente.";
      if (data?.error) {
        msg = data.error;
      } else if (error) {
        try {
          const body = await (error as any)?.context?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* mantém msg padrão */ }
      }
      console.error("[agendar.submit] public-booking", error ?? data);
      if (msg.toLowerCase().includes("ocupado")) setTime("");
      return toast.error(msg);
    }

    const profName = profs.find((p) => p.id === finalProfId)?.name ?? "";
    const msg = `✅ *Agendamento Confirmado!*\n\nOlá ${name}! Seu agendamento foi confirmado com sucesso. 💈\n\n✂️ *Serviço:* ${service.name}\n👤 *Profissional:* ${profName}\n📅 *Data:* ${formatDateBR(date)}\n⏰ *Horário:* ${time}\n💰 *Valor:* ${brl(Number(service.price))}\n\n📍 *${bs.name}*\n${bs.address ?? ""}\n\nQualquer dúvida entre em contato conosco.\nAté lá! 💈`;
    const waUrl = `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");

    setCreated({ service: service.name, price: service.price, prof: profName, date, time, name });
    setSubmitting(false);
    setStep(5);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }
  if (!bs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-3xl tracking-wide">{t("book_not_found")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("book_not_found_sub")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="mx-auto max-w-xl px-4 py-6 md:py-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          {step > 0 && step < 5 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> {t("back")}
            </Button>
          ) : <div />}
          <div className="flex items-center gap-3">
            <LangToggle />
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="font-display text-lg tracking-wider">BARBER<span className="text-gold">HUB</span></span>
            </div>
          </div>
        </div>

        {/* Step 0 — welcome */}
        {step === 0 && (
          <Card className="border-border bg-card p-6 text-center md:p-8">
            {bs.logo_url ? (
              <img src={bs.logo_url} alt={bs.name} className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gold/10">
                <Scissors className="h-10 w-10 text-gold" />
              </div>
            )}
            <h1 className="font-display text-3xl tracking-wide md:text-4xl">{bs.name}</h1>
            {bs.address && (
              <p className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {bs.address}
              </p>
            )}
            {hours.length > 0 && (
              <div className="mt-4 rounded-lg border border-border bg-background/40 p-3 text-left text-xs">
                <div className="mb-1.5 flex items-center gap-1 font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {t("book_hours")}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((label, i) => {
                    const h = hours.find((x) => x.day_of_week === i);
                    return (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono">
                          {!h || h.is_closed ? t("closed") : `${h.open_time.slice(0,5)} – ${h.close_time.slice(0,5)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <Button onClick={() => setStep(1)} className="mt-6 w-full bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold" size="lg">
              {t("book_book_now")}
            </Button>
          </Card>
        )}

        {/* Step 1 — service */}
        {step === 1 && (
          <Card className="border-border bg-card p-5">
            <h2 className="mb-4 font-display text-2xl tracking-wide">{t("book_choose_service")}</h2>
            <div className="space-y-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setServiceId(s.id); setStep(2); }}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    serviceId === s.id ? "border-gold bg-gold/5" : "border-border hover:border-gold/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.duration_minutes} {t("minute")}</div>
                    </div>
                    <div className="font-mono text-gold">{brl(Number(s.price))}</div>
                  </div>
                </button>
              ))}
              {services.length === 0 && <p className="text-sm text-muted-foreground">{t("book_no_services")}</p>}
            </div>
          </Card>
        )}

        {/* Step 2 — professional */}
        {step === 2 && (
          <Card className="border-border bg-card p-5">
            <h2 className="mb-4 font-display text-2xl tracking-wide">{t("book_choose_professional")}</h2>
            <div className="space-y-2">
              <button
                onClick={() => { setProfId(""); setStep(3); }}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition ${
                  profId === "" ? "border-gold bg-gold/5" : "border-border hover:border-gold/40"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{t("book_no_preference")}</div>
                  <div className="text-xs text-muted-foreground">{t("book_no_preference_desc")}</div>
                </div>
              </button>
              {professionalsForService.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProfId(p.id); setStep(3); }}
                  className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition ${
                    profId === p.id ? "border-gold bg-gold/5" : "border-border hover:border-gold/40"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    {p.specialties && <div className="text-xs text-muted-foreground">{p.specialties}</div>}
                  </div>
                </button>
              ))}
              {professionalsForService.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                  {t("book_no_professionals")}
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Step 3 — date and time */}
        {step === 3 && (
          <Card className="border-border bg-card p-5">
            <h2 className="mb-4 font-display text-2xl tracking-wide">{t("book_date_time")}</h2>
            <Label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> {t("book_select_date")}
            </Label>
            <div className="mb-5 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {availableDates.slice(0, 20).map((d) => (
                <button
                  key={d.date}
                  disabled={d.closed}
                  onClick={() => { setDate(d.date); setTime(""); }}
                  className={`rounded-lg border p-2 text-center text-xs transition ${
                    d.closed
                      ? "cursor-not-allowed opacity-30"
                      : date === d.date
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border hover:border-gold/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {date && (
              <>
                <Label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {t("book_available_times")}
                </Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setTime(s)}
                      className={`rounded-lg border p-2 font-mono text-sm transition ${
                        time === s ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {slots.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                    {t("book_no_slots")}
                  </p>
                )}
              </>
            )}

            <Button
              onClick={() => setStep(4)}
              disabled={!date || !time}
              className="mt-5 w-full bg-gradient-gold text-gold-foreground hover:opacity-90"
            >
              {t("next")}
            </Button>
          </Card>
        )}

        {/* Step 4 — client info */}
        {step === 4 && (
          <Card className="border-border bg-card p-5">
            <h2 className="mb-4 font-display text-2xl tracking-wide">{t("book_your_info")}</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t("book_full_name")}</Label>
                <Input value={name} maxLength={100} onChange={(e) => { setName(e.target.value); clearError("name"); }} required />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("book_whatsapp")}</Label>
                <Input value={phone} maxLength={20} onChange={(e) => { setPhone(formatPhone(e.target.value)); clearError("phone"); }} placeholder="(00) 00000-0000" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("book_email_opt")}</Label>
                <Input type="email" value={email} maxLength={254} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("book_obs_opt")}</Label>
                <Input value={notes} maxLength={500} onChange={(e) => { setNotes(e.target.value); clearError("notes"); }} placeholder="Ex: degradê alto" />
                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
              </div>

              {/* Resumo */}
              <div className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                <div className="text-muted-foreground">{t("book_summary")}</div>
                <div className="mt-1 space-y-0.5">
                  <div>✂️ {service?.name} — <span className="text-gold">{brl(Number(service?.price ?? 0))}</span></div>
                  <div>👤 {prof?.name ?? t("book_no_preference_label")}</div>
                  <div>📅 {date && formatDateBR(date)} às {time}</div>
                </div>
              </div>

              <p className="rounded-md bg-muted/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                Ao confirmar, você concorda que seus dados (nome e telefone) serão usados exclusivamente
                para gerenciar este agendamento.
              </p>
              <Button
                onClick={submit}
                disabled={submitting || !name.trim() || onlyDigits(phone).length < 10 || Object.keys(errors).length > 0}
                className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold"
                size="lg"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("book_confirm_appt")}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5 — success */}
        {step === 5 && created && (
          <Card className="border-gold/30 bg-gradient-to-br from-gold/10 to-card p-6 text-center md:p-8">
            <div className="mx-auto mb-4 inline-flex h-20 w-20 animate-in zoom-in items-center justify-center rounded-full bg-success/20 text-success">
              <Check className="h-10 w-10" />
            </div>
            <h1 className="font-display text-3xl tracking-wide">{t("book_success_title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("book_success_sub")}</p>

            <div className="mt-6 space-y-1.5 rounded-lg border border-border bg-background/40 p-4 text-left text-sm">
              <div>✂️ <strong>{created.service}</strong></div>
              <div>👤 {created.prof}</div>
              <div>📅 {formatDateBR(created.date)} às {created.time}</div>
              <div>💰 {brl(Number(created.price))}</div>
              <div className="border-t border-border pt-2 text-muted-foreground">
                📍 {bs.name}{bs.address ? ` — ${bs.address}` : ""}
              </div>
            </div>

            <Button
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => {
                setStep(0); setServiceId(""); setProfId("");
                setDate(""); setTime(""); setName(""); setPhone("");
                setEmail(""); setNotes(""); setCreated(null);
              }}
            >
              {t("book_new_appt")}
            </Button>
          </Card>
        )}

        <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("book_powered_by")}
        </p>
      </div>
    </div>
  );
}
