import { Card, CardContent } from "@/components/ui/card";
import type { MockPerson } from "@/features/alunos/api/student-mock-service";

export function StudentSummaryCard({ person }: { person: MockPerson }) {
  return (
    <Card className="border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)]/40">
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Documento</p>
          <p className="mt-1 text-sm text-[var(--color-foreground)]">{person.documentNumber}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Telefone</p>
          <p className="mt-1 text-sm text-[var(--color-foreground)]">{person.phone}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">Email</p>
          <p className="mt-1 text-sm text-[var(--color-foreground)]">{person.email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
