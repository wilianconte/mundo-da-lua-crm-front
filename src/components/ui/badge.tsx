import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeVariant = "neutral" | "success" | "attention";

const badgeClasses: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--color-surface-muted)] text-[var(--color-foreground)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success-strong)]",
  attention: "bg-[var(--color-secondary-soft)] text-[var(--color-secondary-strong)]"
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        badgeClasses[variant],
        className
      )}
      {...props}
    />
  );
}
