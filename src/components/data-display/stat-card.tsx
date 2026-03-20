import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export function StatCard({ title, value, detail, icon: Icon }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <p className="text-sm text-[var(--color-muted-foreground)]">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">
            {value}
          </p>
          <p className="text-sm text-[var(--color-muted-foreground)]">{detail}</p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-3 text-[var(--color-primary)]">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
