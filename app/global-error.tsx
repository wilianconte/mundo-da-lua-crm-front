"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-[var(--color-surface)] text-[var(--color-foreground)]">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-4 p-6">
          <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">Erro</p>
          <h1 className="text-2xl font-semibold tracking-tight">Algo saiu do esperado.</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Ja registramos o problema e voce pode tentar novamente.
          </p>
          <button
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => reset()}
            type="button"
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
