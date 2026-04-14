"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { getMyPermissionsWithToken } from "@/features/auth/api/get-my-permissions";
import { loginByEmail } from "@/features/auth/api/login-by-email";
import { resetPassword } from "@/features/auth/api/reset-password";
import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ResetPasswordSchema, resetPasswordSchema } from "@/features/auth/schema/reset-password-schema";
import { saveAuthSession } from "@/lib/auth/session";

type ResetPasswordFormProps = {
  token: string;
};

type ResetErrorType = "expired" | "invalid" | null;

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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

      setIsLoggingIn(true);
      const pendingEmail = sessionStorage.getItem("pw_reset_pending_email");

      if (!pendingEmail) {
        sessionStorage.removeItem("pw_reset_pending_email");
        router.push("/login");
        return;
      }

      try {
        const response = await loginByEmail({
          email: pendingEmail,
          password: values.newPassword
        });
        const permissions = await getMyPermissionsWithToken(response.token).catch(() => []);

        await saveAuthSession({
          token: response.token,
          expiresAt: response.expiresAt,
          refreshToken: response.refreshToken,
          refreshTokenExpiresAt: response.refreshTokenExpiresAt,
          tenantId: response.tenantId,
          user: {
            userId: response.userId,
            name: response.name,
            email: response.email,
            isAdmin: response.isAdmin,
            permissions
          }
        });

        sessionStorage.removeItem("pw_reset_pending_email");
        router.push("/");
        router.refresh();
      } catch {
        router.push("/login");
      }
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
    <>
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
                className="h-12 rounded-[var(--radius-control)] border-slate-300 bg-[#eef1f5] pl-10"
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
                className="h-12 rounded-[var(--radius-control)] border-slate-300 bg-[#eef1f5] pl-10"
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
            className="h-12 w-full rounded-[var(--radius-control)] bg-[#0a2f68] text-white hover:bg-[#09306f]"
            size="lg"
            type="submit"
          >
            {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
          </Button>

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

      {isLoggingIn ? (
        <div
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 size-5 animate-spin text-[var(--color-primary)]" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-[var(--color-foreground)]">
                  {"Redefini\u00e7\u00e3o realizada com sucesso!"}
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">Entrando na sua conta...</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
