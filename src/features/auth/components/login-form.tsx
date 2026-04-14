"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { getMyPermissionsWithToken } from "@/features/auth/api/get-my-permissions";
import { loginByEmail } from "@/features/auth/api/login-by-email";
import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type LoginSchema, loginSchema } from "@/features/auth/schema/login-schema";
import { type GraphQLRequestError } from "@/lib/graphql/client";
import { isAuthenticated, saveAuthSession } from "@/lib/auth/session";

type LoginFormProps = {
  embedded?: boolean;
};


export function LoginForm({ embedded = false }: LoginFormProps) {
  const router = useRouter();
  const [socialInfoMessage, setSocialInfoMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  async function onSubmit(values: LoginSchema) {
    try {
      setSocialInfoMessage(null);
      const response = await loginByEmail({
        email: values.email.trim().toLowerCase(),
        password: values.password
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

      router.push("/");
      router.refresh();
    } catch (error) {
      const code = (error as GraphQLRequestError).code;
      const messageByCode: Record<string, string> = {
        VALIDATION_ERROR: "Campos invalidos. Revise os dados e tente novamente.",
        INVALID_CREDENTIALS: "Email ou senha incorretos.",
        USER_INACTIVE: "Usuario desativado. Procure um administrador.",
        AUTH_NOT_AUTHORIZED: "Nao foi possivel autenticar sua sessao."
      };

      setError("root", {
        message: messageByCode[code ?? ""] ?? "Nao foi possivel entrar. Tente novamente."
      });
    }
  }

  function handleGoogleSocialLogin() {
    setSocialInfoMessage("Login com Google sera habilitado em breve.");
  }

  const content = (
    <div className="w-full">
      <form className="mx-auto w-full max-w-[310px] space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Field>
          <FieldLabel className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600" htmlFor="email">
            E-mail
          </FieldLabel>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              autoComplete="username"
              className="h-12 rounded-[var(--radius-control)] border-slate-300 bg-[#eef1f5] pl-10"
              id="email"
              placeholder="seu@email.com"
              type="email"
              {...register("email")}
            />
          </div>
          {errors.email ? <FieldMessage>{errors.email.message}</FieldMessage> : null}
        </Field>

        <Field>
          <FieldLabel className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600" htmlFor="password">
            Senha
          </FieldLabel>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              autoComplete="current-password"
              className="h-12 rounded-[var(--radius-control)] border-slate-300 bg-[#eef1f5] pl-10"
              id="password"
              placeholder="Digite sua senha"
              type="password"
              {...register("password")}
            />
          </div>
          {errors.password ? <FieldMessage>{errors.password.message}</FieldMessage> : null}
        </Field>

        <Button
          className="mt-2 h-12 w-full rounded-[var(--radius-control)] bg-[#0a2f68] text-white hover:bg-[#09306f]"
          leadingIcon={<ArrowRight className="size-4" />}
          size="lg"
          type="submit"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>

        <div className="relative py-1">
          <div className="h-px w-full bg-slate-200" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            ou com SSO
          </span>
        </div>

        <Button
          className="h-12 w-full justify-center gap-2 rounded-[var(--radius-control)] border-slate-300 bg-[#f3f4f6] text-slate-700 hover:bg-slate-100"
          onClick={handleGoogleSocialLogin}
          type="button"
          variant="outline"
        >
          <span aria-hidden="true" className="text-base font-bold leading-none text-[#EA4335]">
            G
          </span>
          Logar com Google
        </Button>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm">
          <Link className="font-semibold text-[#0a2f68] hover:text-[#061d41]" href="/esqueci-senha">
            Esqueci minha senha
          </Link>
          <Link className="font-semibold text-[#0a2f68] hover:text-[#061d41]" href="/criar-conta">
            Criar conta
          </Link>
        </div>

        {errors.root?.message ? <FieldMessage>{errors.root.message}</FieldMessage> : null}
        {socialInfoMessage ? <FieldMessage>{socialInfoMessage}</FieldMessage> : null}
      </form>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[#d7e3ff] bg-white p-6 shadow-[0_16px_40px_rgba(3,14,34,0.45)] md:p-8">
      {content}
    </div>
  );
}
