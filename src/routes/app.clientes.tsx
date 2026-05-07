import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/app/clientes")({
  component: () => <ComingSoon title="Clientes" />,
});

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-3xl tracking-wide md:text-4xl">{title}</h1>
      <Card className="mt-6 border-dashed border-border bg-card p-12 text-center">
        <Construction className="mx-auto mb-3 h-10 w-10 text-gold" />
        <h2 className="font-display text-2xl tracking-wide">Em construção</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Este módulo será liberado na próxima fase, junto com lembretes automáticos e histórico completo.
        </p>
      </Card>
    </div>
  );
}
