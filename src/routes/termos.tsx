import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  component: TermosDeUso,
});

function S({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-4 text-base font-semibold text-gold">
        {n}. {title}
      </h2>
      <div className="space-y-2 text-[15px] leading-[1.8] text-foreground">{children}</div>
    </section>
  );
}

function TermosDeUso() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-display text-lg tracking-wider">BARBER<span className="text-gold">HUB</span></span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl tracking-wide md:text-5xl">Termos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: junho de 2025</p>

        <div className="mt-10 space-y-8">
          <S n="1" title="ACEITAÇÃO DOS TERMOS">
            <p>
              Ao criar uma conta no BarberHub, você concorda com estes Termos de Uso integralmente.
              Se não concordar, não utilize o serviço.
            </p>
          </S>

          <S n="2" title="DESCRIÇÃO DO SERVIÇO">
            <p>O BarberHub é uma plataforma SaaS (Software como Serviço) de gestão para barbearias que oferece:</p>
            <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
              <li>Sistema de agendamento online</li>
              <li>Controle financeiro</li>
              <li>Gestão de estoque</li>
              <li>Gestão de clientes</li>
              <li>Link público de agendamento para clientes finais</li>
            </ul>
          </S>

          <S n="3" title="CADASTRO E CONTA">
            <ul className="space-y-1 text-muted-foreground">
              <li>3.1 Você deve ter 18 anos ou mais para criar uma conta.</li>
              <li>3.2 As informações de cadastro devem ser verdadeiras e atualizadas.</li>
              <li>3.3 Você é responsável pela segurança da sua senha.</li>
              <li>3.4 Não compartilhe suas credenciais de acesso.</li>
              <li>3.5 Uma conta por estabelecimento comercial.</li>
            </ul>
          </S>

          <S n="4" title="PLANOS E PAGAMENTOS">
            <ul className="space-y-1 text-muted-foreground">
              <li>4.1 O BarberHub oferece período de teste gratuito de 7 dias, sem necessidade de cartão de crédito.</li>
              <li>4.2 Após o período de teste, é necessário assinar um plano pago para continuar utilizando.</li>
              <li>4.3 Os valores são cobrados mensalmente via cartão de crédito processado pelo Stripe.</li>
              <li>4.4 Não há reembolso por períodos parciais.</li>
              <li>4.5 O cancelamento pode ser feito a qualquer momento e o acesso permanece até o fim do período pago.</li>
            </ul>
          </S>

          <S n="5" title="DADOS DOS SEUS CLIENTES">
            <ul className="space-y-1 text-muted-foreground">
              <li>5.1 Você é o controlador dos dados dos seus clientes (nomes, telefones, histórico de atendimentos).</li>
              <li>5.2 O BarberHub atua como operador desses dados, conforme definido pela LGPD (Lei 13.709/2018).</li>
              <li>5.3 Você é responsável por obter o consentimento dos seus clientes para o uso dos dados.</li>
              <li>5.4 O BarberHub não vende, compartilha ou usa os dados dos seus clientes para outros fins.</li>
            </ul>
          </S>

          <S n="6" title="USO ACEITÁVEL">
            <p className="text-muted-foreground">É proibido utilizar o BarberHub para:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1 text-muted-foreground">
              <li>Cadastrar informações falsas ou enganosas</li>
              <li>Violar direitos de terceiros</li>
              <li>Atividades ilegais de qualquer natureza</li>
              <li>Tentar acessar dados de outros usuários</li>
              <li>Realizar engenharia reversa do sistema</li>
            </ul>
          </S>

          <S n="7" title="DISPONIBILIDADE">
            <ul className="space-y-1 text-muted-foreground">
              <li>7.1 Buscamos disponibilidade de 99% do tempo.</li>
              <li>7.2 Manutenções programadas serão avisadas com antecedência de 24 horas.</li>
              <li>7.3 Não nos responsabilizamos por indisponibilidades causadas por terceiros (internet, fornecedores).</li>
            </ul>
          </S>

          <S n="8" title="LIMITAÇÃO DE RESPONSABILIDADE">
            <p className="text-muted-foreground">O BarberHub não se responsabiliza por:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1 text-muted-foreground">
              <li>Perda de receita causada por indisponibilidade</li>
              <li>Danos causados pelo uso inadequado da plataforma</li>
              <li>Decisões comerciais tomadas com base nos dados</li>
            </ul>
          </S>

          <S n="9" title="MODIFICAÇÕES">
            <p className="text-muted-foreground">
              Podemos alterar estes termos com aviso prévio de 15 dias por e-mail.
              O uso continuado após as alterações implica aceitação.
            </p>
          </S>

          <S n="10" title="ENCERRAMENTO">
            <p className="text-muted-foreground">
              Podemos encerrar sua conta em caso de violação destes termos, com notificação por e-mail.
            </p>
          </S>

          <S n="11" title="LEI APLICÁVEL">
            <p className="text-muted-foreground">
              Estes termos são regidos pelas leis brasileiras.
              Foro eleito: comarca de Ponta Grossa, Paraná.
            </p>
          </S>

          <S n="12" title="CONTATO">
            <p className="text-muted-foreground">
              E-mail:{" "}
              <a href="mailto:suporte@barberhub.com.br" className="text-gold hover:underline">
                suporte@barberhub.com.br
              </a>
            </p>
          </S>
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BarberHub — Todos os direitos reservados
      </footer>
    </div>
  );
}
