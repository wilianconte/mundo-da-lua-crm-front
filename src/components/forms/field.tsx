import type { HTMLAttributes, LabelHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Field({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-[var(--color-foreground)]", className)}
      {...props}
    />
  );
}

export function FieldMessage({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-[var(--color-muted-foreground)]", className)}
      {...props}
    />
  );
}
