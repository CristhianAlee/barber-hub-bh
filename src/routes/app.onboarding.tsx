import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Clock, Loader2, Scissors, Store, User } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/app/onboarding")({
  component: Onboarding,
});

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function Onboarding() {
  const { barbershop, refreshBarbershop, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — barbershop info
  const [bsName, setBsName] = useState(barbershop?.name ?? "");
  const [address, setAddress] = useState(barbershop?.address ?? "");

  // Step 2 — business hours
  const [openDays, setOpenDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("20:00");
  const [interval, setInterval] = useState(String(barbershop?.booking_interval_minutes ?? 30));

  // Step 3 — professional
  const [profName, setProfName] = useState("");

  // Step 4 — services
  const [services, setServices] = useState([
    { name: "Corte", duration: 30, price: 40 },
    { name: "Barba", duration: 20, price: 25 },
    { name: "Corte + Barba", duration: 50, price: 60 },
  ]);

  const toggleDay = (dow: number) =>
    setOpenDays((prev) => prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]);

  const finish = async () => {
    if (!barbershop) return;
    setLoading(true);
    await supabase.from("barbershops").update({ onboarded: true }).eq("id", barbershop.id);
    await refreshBarbershop();
    toast.success("Tudo pronto!");
    navigate({ to: "/app" });
  };

  const saveStep1 = async () => {
    if (!user) return;
    if (!bsName.trim()) return toast.error("Informe o nome da barbearia");
    setLoading(true);
    if (!barbershop) {
      const base = slugify(bsName) || "barbearia";
      const slug = `${base}-${user.id.slice(0, 6)}`;
      const { error } = await supabase.from("barbershops").insert({
        owner_id: user.id, name: bsName, address: address || null,
        slug, onboarded: false, booking_interval_minutes: 30, max_advance_days: 30,
      });
      setLoading(false);
      if (error) {
        console.error("[Onboarding] criar barbearia:", error);
        return toast.error(getFriendlyErrorMessage(error, "criar a barbearia"));
      }
    } else {
      const { error } = await supabase
        .from("barbershops").update({ name: bsName, address: address || null }).eq("id", barbershop.id);
      setLoading(false);
      if (error) return toast.error("Erro ao salvar");
    }
    await refreshBarbershop();
    setStep(2);
  };

  const saveStep2 = async (skip = false) => {
    if (!barbershop) return;
    if (!skip) {
      setLoading(true);
      const rows = Array.from({ length: 7 }, (_, dow) => ({
        barbershop_id: barbershop.id,
        day_of_week: dow,
        open_time: openTime,
        close_time: closeTime,
        is_closed: !openDays.includes(dow),
      }));
      const { error: bhErr } = await supabase
        .from("business_hours")
        .upsert(rows, { onConflict: "barbershop_id,day_of_week" });
      if (bhErr) { setLoading(false); return toast.error("Erro ao salvar horários"); }
      await supabase.from("barbershops")
        .update({ booking_interval_minutes: Number(interval) }).eq("id", barbershop.id);
      await refreshBarbershop();
      setLoading(false);
    }
    setStep(3);
  };

  const saveStep3 = async (skip = false) => {
    if (!barbershop) return;
    if (!skip && profName.trim()) {
      setLoading(true);
      const { error } = await supabase.from("professionals").insert({
        barbershop_id: barbershop.id, name: profName.trim(),
      });
      setLoading(false);
      if (error) return toast.error("Erro ao salvar profissional");
    }
    setStep(4);
  };

  const saveStep4 = async (skip = false) => {
    if (!barbershop) return;
    if (!skip) {
      setLoading(true);
      const valid = services.filter((s) => s.name.trim() && s.price > 0);
      if (valid.length) {
        const { error } = await supabase.from("services").insert(
          valid.map((s) => ({
            barbershop_id: barbershop.id, name: s.name,
            duration_minutes: s.duration, price: s.price,
          })),
        );
        if (error) { setLoading(false); return toast.error("Erro ao salvar serviços"); }
      }
    }
    await finish();
  };

  return (
    <div className="min-h-screen bg-gradient-dark px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={56} />
          <h1 className="mt-3 font-display text-3xl tracking-wide md:text-4xl">
            Bem-vindo ao <span className="text-gold">BarberHub</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure sua barbearia em 4 passos rápidos</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`h-1.5 max-w-16 flex-1 rounded-full transition ${step >= n ? "bg-gold" : "bg-muted"}`} />
          ))}
        </div>

        <Card className="border-border bg-card p-6 md:p-8">

          {/* STEP 1 — name + address */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gold">
                <Store className="h-5 w-5" />
                <span className="font-display text-xl tracking-wide">Sua barbearia</span>
              </div>
              <div className="space-y-1.5">
                <Label>Nome da barbearia</Label>
                <Input value={bsName} onChange={(e) => setBsName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Endereço</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" />
              </div>
              <div className="flex justify-between pt-2">
                {barbershop ? (
                  <Button variant="ghost" onClick={() => setStep(2)}>Pular por agora</Button>
                ) : <div />}
                <Button onClick={saveStep1} disabled={loading || !bsName.trim()} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Próximo"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 — business hours */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gold">
                <Clock className="h-5 w-5" />
                <span className="font-display text-xl tracking-wide">Horários e agendamento</span>
              </div>
              <div className="space-y-1.5">
                <Label>Intervalo entre agendamentos</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dias de atendimento</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_PT.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        openDays.includes(i)
                          ? "border-gold bg-gold/15 text-gold"
                          : "border-border text-muted-foreground hover:border-gold/30"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Abre às</Label>
                  <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha às</Label>
                  <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => saveStep2(true)}>Pular</Button>
                <Button onClick={() => saveStep2(false)} disabled={loading || openDays.length === 0} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Próximo"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 — professional */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gold">
                <User className="h-5 w-5" />
                <span className="font-display text-xl tracking-wide">Profissional</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Adicione um profissional (pode ser você mesmo). Você pode adicionar mais depois.
              </p>
              <div className="space-y-1.5">
                <Label>Nome do profissional</Label>
                <Input value={profName} onChange={(e) => setProfName(e.target.value)} placeholder="Ex: João Silva" />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => saveStep3(true)}>Pular</Button>
                <Button onClick={() => saveStep3(false)} disabled={loading} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Próximo"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4 — services */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gold">
                <Scissors className="h-5 w-5" />
                <span className="font-display text-xl tracking-wide">Serviços</span>
              </div>
              <p className="text-sm text-muted-foreground">Sugerimos os clássicos. Edite ou apague o que quiser.</p>
              <div className="space-y-2">
                {services.map((s, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <Input className="col-span-6" value={s.name} placeholder="Serviço"
                      onChange={(e) => { const c = [...services]; c[i].name = e.target.value; setServices(c); }} />
                    <Input className="col-span-3" type="number" value={s.duration}
                      onChange={(e) => { const c = [...services]; c[i].duration = Number(e.target.value); setServices(c); }} />
                    <Input className="col-span-3" type="number" value={s.price}
                      onChange={(e) => { const c = [...services]; c[i].price = Number(e.target.value); setServices(c); }} />
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground">
                  <div className="col-span-6">Nome</div>
                  <div className="col-span-3">Min</div>
                  <div className="col-span-3">R$</div>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => saveStep4(true)} disabled={loading}>Pular</Button>
                <Button onClick={() => saveStep4(false)} disabled={loading} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Concluir</>}
                </Button>
              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
}
