"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryExamplePage() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const clientDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const sentryEnabled = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true";

  async function sendMessage() {
    Sentry.captureMessage("Teste manual enviado de /sentry-example-page");
    await Sentry.flush(2000);
    setStatusMessage("Mensagem enviada. Verifique o projeto no Sentry.");
  }

  async function sendException() {
    Sentry.captureException(new Error("Erro de teste disparado em /sentry-example-page"));
    await Sentry.flush(2000);
    setStatusMessage("Excecao enviada. Verifique a lista de Issues no Sentry.");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-4 p-6">
      <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
        Sentry
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Pagina de teste do Sentry</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Use os botoes abaixo para validar captura de mensagem e excecao.
      </p>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-muted-foreground)]">
        <p>
          Sentry client habilitado: <strong>{sentryEnabled ? "sim" : "nao"}</strong>
        </p>
        <p>
          NEXT_PUBLIC_SENTRY_DSN configurado: <strong>{clientDsn ? "sim" : "nao"}</strong>
        </p>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
          onClick={sendMessage}
          type="button"
        >
          Enviar mensagem para Sentry
        </button>

        <button
          className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)]"
          onClick={sendException}
          type="button"
        >
          Enviar excecao para Sentry
        </button>
      </div>

      {statusMessage ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{statusMessage}</p>
      ) : null}
    </main>
  );
}
