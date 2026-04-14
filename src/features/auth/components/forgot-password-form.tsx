"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { requestPasswordReset } from "@/features/auth/api/request-password-reset";
import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type ForgotPasswordSchema,
  forgotPasswordSchema
} from "@/features/auth/schema/forgot-password-schema";

type ForgotPasswordFormProps = {
  hideHeader?: boolean;
};

export function ForgotPasswordForm({ hideHeader = false }: ForgotPasswordFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  async function onSubmit(values: ForgotPasswordSchema) {
    try {
      setSuccessMessage(null);
      clearErrors("root");
      await requestPasswordReset({
        email: values.email.trim().toLowerCase()
      });
      sessionStorage.setItem("pw_reset_pending_email", values.email.trim().toLowerCase());
      setSuccessMessage(
        `Se o e-mail ${values.email} estiver cadastrado, enviaremos as instru\u00e7\u00f5es de recupera\u00e7\u00e3o.`
      );
    } catch {
      setError("root", {
        message: "N\u00e3o foi poss\u00edvel enviar a solicita\u00e7\u00e3o agora. Tente novamente."
      });
    }
  }

  return (
    <div className="w-full">
      {!hideHeader ? (
        <header className="space-y-2 text-center">
          <h2 className="flex items-center justify-center gap-2 text-4xl font-bold tracking-tight text-[#0a2f68]">
            <Mail className="size-7" />
            Esqueci minha senha
          </h2>
          <p className="text-base text-slate-600">Informe seu e-mail para recuperar o acesso.</p>
        </header>
      ) : null}

      <form className="mx-auto w-full max-w-[310px] space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Field>
          <FieldLabel
            className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
            htmlFor="forgot-email"
          >
            E-mail
          </FieldLabel>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              autoComplete="username"
              className="h-12 rounded-[var(--radius-control)] border-slate-300 bg-[#eef1f5] pl-10"
              id="forgot-email"
              placeholder="seu@email.com"
              type="email"
              {...register("email")}
            />
          </div>
          {errors.email ? <FieldMessage>{errors.email.message}</FieldMessage> : null}
        </Field>

        <Button
          className="h-12 w-full rounded-[var(--radius-control)] bg-[#0a2f68] text-white hover:bg-[#09306f]"
          size="lg"
          type="submit"
        >
          {isSubmitting ? "Enviando..." : "Enviar recuperacao"}
        </Button>

        <Link
          className="flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-sm font-semibold text-[#0a2f68] hover:text-[#061d41]"
          href="/login"
        >
          <ArrowLeft className="size-4" />
          Voltar para login
        </Link>

        {errors.root?.message ? <FieldMessage>{errors.root.message}</FieldMessage> : null}
        {successMessage ? <FieldMessage className="text-emerald-700">{successMessage}</FieldMessage> : null}
      </form>
    </div>
  );
}
