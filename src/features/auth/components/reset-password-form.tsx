"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { resetPassword } from "@/features/auth/api/reset-password";
import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ResetPasswordSchema, resetPasswordSchema } from "@/features/auth/schema/reset-password-schema";

type ResetPasswordFormProps = {
  token: string;
};

type ResetErrorType = "expired" | "invalid" | null;

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetErrorType, setResetErrorType] = useState<ResetErrorType>(null);
  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: "",
      newPasswordConfirmation: ""
    }
  });

  async function onSubmit(values: ResetPasswordSchema) {
    try {
      setSuccessMessage(null);
      setResetErrorType(null);
      clearErrors("root");

      const didReset = await resetPassword({
        token: values.token,
        newPassword: values.newPassword,
        newPasswordConfirmation: values.newPasswordConfirmation
      });

      if (!didReset) {
        setResetErrorType("invalid");
        return;
      }

      setSuccessMessage("Senha redefinida com sucesso! Voc\u00ea pode fazer login agora.");
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("expir")) {
        setResetErrorType("expired");
        return;
      }

      setResetErrorType("invalid");
    }
  }

  return (
    <div className="w-full">
      <form className="mx-auto w-full max-w-[310px] space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("token")} />

        <Field>
          <FieldLabel
            className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
            htmlFor="new-password"
          >
            Nova senha
          </FieldLabel>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              autoComplete="new-password"
              className="h-12 rounded-none border-slate-300 bg-[#eef1f5] pl-10"
              id="new-password"
              placeholder="Digite sua nova senha"
              type="password"
              {...register("newPassword")}
            />
          </div>
          {errors.newPassword ? <FieldMessage>{errors.newPassword.message}</FieldMessage> : null}
        </Field>

        <Field>
          <FieldLabel
            className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600"
            htmlFor="new-password-confirmation"
          >
            Confirmar nova senha
          </FieldLabel>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              autoComplete="new-password"
              className="h-12 rounded-none border-slate-300 bg-[#eef1f5] pl-10"
              id="new-password-confirmation"
              placeholder="Digite novamente sua nova senha"
              type="password"
              {...register("newPasswordConfirmation")}
            />
          </div>
          {errors.newPasswordConfirmation ? (
            <FieldMessage>{errors.newPasswordConfirmation.message}</FieldMessage>
          ) : null}
        </Field>

        <Button
          className="h-12 w-full rounded-none bg-[#0a2f68] text-white hover:bg-[#09306f]"
          size="lg"
          type="submit"
        >
          {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
        </Button>

        {successMessage ? (
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <FieldMessage className="text-emerald-700">{successMessage}</FieldMessage>
            <Link className="text-sm font-semibold text-[#0a2f68] hover:text-[#061d41]" href="/login">
              Ir para login
            </Link>
          </div>
        ) : null}

        {resetErrorType === "expired" ? (
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <FieldMessage>Este link expirou. Solicite um novo link.</FieldMessage>
            <Link className="text-sm font-semibold text-[#0a2f68] hover:text-[#061d41]" href="/esqueci-senha">
              Solicitar novo link
            </Link>
          </div>
        ) : null}

        {resetErrorType === "invalid" ? (
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <FieldMessage>Link inv\u00e1lido ou j\u00e1 utilizado.</FieldMessage>
            <Link className="text-sm font-semibold text-[#0a2f68] hover:text-[#061d41]" href="/esqueci-senha">
              Solicitar novo link
            </Link>
          </div>
        ) : null}
      </form>
    </div>
  );
}
