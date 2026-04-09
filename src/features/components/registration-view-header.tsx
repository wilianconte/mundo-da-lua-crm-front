import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

type FeatureViewHeaderProps = {
  actions?: ReactNode;
  backAriaLabel: string;
  backHref: string;
  description?: ReactNode;
  title: ReactNode;
};

export function FeatureViewHeader({
  actions,
  backAriaLabel,
  backHref,
  description,
  title
}: FeatureViewHeaderProps) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            aria-label={backAriaLabel}
            className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
            href={backHref}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            {description ? <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3 [&>button]:min-w-40">{actions}</div> : null}
      </div>
    </section>
  );
}

// Compatibilidade temporaria: manter export antigo durante migracao de imports.
export const RegistrationViewHeader = FeatureViewHeader;
