import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger-outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand-menu)] text-white hover:bg-[var(--color-brand-menu-muted)] hover:text-white hover:shadow-[var(--shadow-soft)]",
  secondary:
    "bg-[var(--color-secondary-soft)] text-[var(--color-secondary-strong)] hover:bg-[var(--color-secondary)] hover:text-white hover:shadow-[var(--shadow-soft)]",
  ghost:
    "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]",
  outline:
    "border border-[var(--color-border-strong)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)] hover:shadow-[var(--shadow-soft)]",
  "danger-outline":
    "border border-red-300 bg-transparent text-[var(--color-danger-strong)] hover:border-red-400 hover:bg-red-50 hover:text-red-800 hover:shadow-[var(--shadow-soft)]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-[var(--radius-sm)] px-3 text-sm",
  md: "h-11 rounded-[var(--radius-md)] px-4 text-sm",
  lg: "h-12 rounded-[var(--radius-md)] px-5 text-base"
};

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  leadingIcon,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition duration-200 ease-[var(--ease-standard)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-menu)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:pointer-events-none disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      type={type}
      {...props}
    >
      {leadingIcon}
      {children}
    </button>
  );
}
