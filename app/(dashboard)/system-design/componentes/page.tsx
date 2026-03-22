import { SystemDesignComponentsShowcase } from "@/features/system-design/components/system-design-components-showcase";

export default function SystemDesignComponentsPage() {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
          System Design
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">Biblioteca de componentes</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Referencia visual e comportamental para componentes reutilizaveis da aplicacao.
        </p>
      </div>
      <SystemDesignComponentsShowcase />
    </div>
  );
}
