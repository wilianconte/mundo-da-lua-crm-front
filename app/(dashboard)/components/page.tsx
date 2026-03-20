import { ComponentsShowcase } from "@/features/components/components-showcase";

export default function ComponentsPage() {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
          Components
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">Modelos iniciais do design system</h2>
      </div>
      <ComponentsShowcase />
    </div>
  );
}
