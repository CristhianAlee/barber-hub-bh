import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  component: PoliticaDePrivacidade,
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

function PoliticaDePrivacidade() {
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
        <h1 className="font-display text-4xl tracking-wide md:text-5xl">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: junho de 2025</p>
        <div className="mt-4 rounded-lg border border-border bg-card/50 p-4 text-[13px] text-muted-foreground">
          <strong className="text-foreground">Controlador dos dados:</strong> BarberHub<br />
          <strong className="text-foreground">E-mail do DPO:</strong>{" "}
          <a href="mailto:privacidade@barberhub.com.br" className="text-gold hover:underline">
            privacidade@barberhub.com.br
          </a>
        </div>

        <div className="mt-10 space-y-8">
          <S n="1" title="QUAIS DADOS COLETAMOS">
            <div className="space-y-4">
              <div>
                <p className="font-medium text-foreground">Dados da conta do barbeiro:</p>
                <ul className="ml-4 mt-1 list-disc space-y-0.5 text-muted-foreground">
                  <li>Nome completo e nome da barbearia</li>
                  <li>Endereço do estabelecimento</li>
                  <li>E-mail e telefone (WhatsApp)</li>
                  <li>Dados de pagamento (processados pelo Stripe — não armazenamos dados de cartão)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Dados dos clientes da barbearia:</p>
                <ul className="ml-4 mt-1 list-disc space-y-0.5 text-muted-foreground">
                  <li>Nome, telefone e e-mail (opcional)</li>
                  <li>Histórico de agendamentos</li>
                  <li>Observações inseridas pelo barbeiro</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Dados técnicos:</p>
                <ul className="ml-4 mt-1 list-disc space-y-0.5 text-muted-foreground">
                  <li>Endereço IP, tipo de navegador e dispositivo</li>
                  <li>Logs de acesso ao sistema</li>
                  <li>Cookies de sessão e preferências</li>
                </ul>
              </div>
            </div>
          </S>

          <S n="2" title="COMO USAMOS OS DADOS">
            <div className="space-y-3">
              <div>
                <p className="font-medium text-foreground">Dados da conta:</p>
                <ul className="ml-4 mt-1 list-disc space-y-0.5 text-muted-foreground">
                  <li>Autenticação e acesso ao sistema</li>
                  <li>Comunicações sobre o serviço e cobrança da assinatura</li>
                  <li>Suporte ao cliente</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Dados dos clientes da barbearia:</p>
                <ul className="ml-4 mt-1 list-disc space-y-0.5 text-muted-foreground">
                  <li>Exibição no painel do barbeiro</li>
                  <li>Histórico de atendimentos</li>
                  <li>Sistema de lembretes (acionado manualmente pelo barbeiro)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Dados técnicos:</p>
                <ul className="ml-4 mt-1 list-disc space-y-0.5 text-muted-foreground">
                  <li>Segurança, prevenção de fraudes e melhoria do sistema</li>
                </ul>
              </div>
            </div>
          </S>

          <S n="3" title="BASE LEGAL (LGPD — ART. 7)">
            <ul className="space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Execução de contrato:</strong> dados necessários para prestar o serviço contratado</li>
              <li><strong className="text-foreground">Legítimo interesse:</strong> segurança e melhoria do sistema</li>
              <li><strong className="text-foreground">Consentimento:</strong> comunicações de marketing (opcional, revogável a qualquer momento)</li>
            </ul>
          </S>

          <S n="4" title="COMPARTILHAMENTO DE DADOS">
            <p className="text-muted-foreground">Compartilhamos dados apenas com parceiros essenciais:</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-border p-3">
                <p className="font-medium text-foreground">Stripe (pagamentos)</p>
                <p className="text-sm text-muted-foreground">
                  Dados necessários para cobrança. Política:{" "}
                  <span className="text-gold">stripe.com/privacy</span>
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="font-medium text-foreground">Supabase (infraestrutura)</p>
                <p className="text-sm text-muted-foreground">
                  Hospedagem com criptografia, servidores em sa-east-1 (São Paulo).
                  Política: <span className="text-gold">supabase.com/privacy</span>
                </p>
              </div>
            </div>
            <p className="mt-3 text-muted-foreground">
              Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais.
            </p>
          </S>

          <S n="5" title="RETENÇÃO DE DADOS">
            <ul className="space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Conta ativa:</strong> durante toda a vigência</li>
              <li><strong className="text-foreground">Após cancelamento:</strong> 90 dias (para possível reativação)</li>
              <li><strong className="text-foreground">Após 90 dias:</strong> exclusão definitiva de todos os dados</li>
              <li><strong className="text-foreground">Dados de pagamento:</strong> conforme exigido pela legislação fiscal</li>
            </ul>
          </S>

          <S n="6" title="SEUS DIREITOS (LGPD — ART. 18)">
            <p className="text-muted-foreground">Você tem direito a:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1 text-muted-foreground">
              <li>Confirmação da existência de tratamento e acesso aos seus dados</li>
              <li>Correção de dados incompletos ou incorretos</li>
              <li>Anonimização, bloqueio ou eliminação</li>
              <li>Portabilidade dos dados e revogação do consentimento</li>
              <li>Eliminação dos dados tratados com consentimento</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Para exercer seus direitos:{" "}
              <a href="mailto:privacidade@barberhub.com.br" className="text-gold hover:underline">
                privacidade@barberhub.com.br
              </a>{" "}
              — prazo de resposta: até 15 dias úteis.
            </p>
          </S>

          <S n="7" title="COOKIES">
            <p className="text-muted-foreground">Utilizamos cookies para:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1 text-muted-foreground">
              <li>Manter sua sessão ativa (essencial)</li>
              <li>Lembrar suas preferências de tema e idioma</li>
              <li>Análise de uso do sistema (opcional, mediante consentimento)</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              Você pode desativar cookies no navegador, mas isso pode afetar o funcionamento do sistema.
            </p>
          </S>

          <S n="8" title="SEGURANÇA">
            <p className="text-muted-foreground">Medidas implementadas:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1 text-muted-foreground">
              <li>Criptografia em trânsito (HTTPS/TLS) e em repouso no banco de dados</li>
              <li>Row Level Security: cada barbeiro acessa apenas seus próprios dados</li>
              <li>Autenticação segura via Supabase Auth com tokens JWT e expiração automática</li>
              <li>Sem armazenamento de senhas em texto plano</li>
            </ul>
          </S>

          <S n="9" title="TRANSFERÊNCIA INTERNACIONAL">
            <p className="text-muted-foreground">
              Seus dados são processados em servidores localizados no Brasil (sa-east-1 / São Paulo)
              pelo Supabase, em conformidade com a LGPD.
            </p>
          </S>

          <S n="10" title="ENCARREGADO DE DADOS (DPO)">
            <p className="text-muted-foreground">
              Nome: BarberHub — Equipe de Privacidade<br />
              E-mail:{" "}
              <a href="mailto:privacidade@barberhub.com.br" className="text-gold hover:underline">
                privacidade@barberhub.com.br
              </a>
              <br />
              Disponível para dúvidas sobre privacidade e exercício de direitos previstos na LGPD.
            </p>
          </S>

          <S n="11" title="ALTERAÇÕES">
            <p className="text-muted-foreground">
              Notificaremos por e-mail sobre alterações relevantes com 15 dias de antecedência.
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
