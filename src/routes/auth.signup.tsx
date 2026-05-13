import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatPhone, onlyDigits, passwordStrength } from "@/lib/format";

export const Route = createFileRoute("/auth/signup")({
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    barbershop: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
    terms: false,
  });
  const [loading, setLoading] = useState(false);

  const ps = passwordStrength(form.password);
  const phoneDigits = onlyDigits(form.phone);
  const valid =
    form.name.trim().length >= 2 &&
    form.barbershop.trim().length >= 2 &&
    phoneDigits.length >= 10 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.password.length >= 8 &&
    form.password === form.confirm &&
    form.terms;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          full_name: form.name,
          barbershop_name: form.barbershop,
          phone: phoneDigits,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("already") ? "Este e-mail já está cadastrado" : "Erro ao criar conta");
      return;
    }
    toast.success("Conta criada! Verifique seu e-mail");
    navigate({ to: "/auth/verify", search: { email: form.email } });
  };

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide">Criar conta</h1>
      <p className="mt-1 text-sm text-muted-foreground">Comece a gerenciar sua barbearia em minutos</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Seu nome completo</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bs">Nome da barbearia</Label>
          <Input id="bs" value={form.barbershop} onChange={(e) => setForm({ ...form, barbershop: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">WhatsApp</Label>
          <Input
            id="phone"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
            placeholder="(00) 00000-0000"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Senha</Label>
          <Input
            id="pw"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
          />
          {form.password && (
            <div className="flex items-center gap-2">
              <div className="flex h-1.5 flex-1 gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full ${
                      i < ps.score
                        ? ps.score <= 2
                          ? "bg-destructive"
                          : ps.score === 3
                          ? "bg-warning"
                          : "bg-success"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{ps.label}</span>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <Input
            id="confirm"
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
          />
          {form.confirm && form.confirm !== form.password && (
            <p className="text-xs text-destructive">As senhas não coincidem</p>
          )}
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={form.terms}
            onCheckedChange={(v) => setForm({ ...form, terms: !!v })}
            className="mt-0.5"
          />
          <span>
            Aceito os termos de uso e política de privacidade do BarberHub
          </span>
        </label>

        <Button
          type="submit"
          disabled={!valid || loading}
          className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta grátis"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link to="/auth/login" className="text-gold hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
