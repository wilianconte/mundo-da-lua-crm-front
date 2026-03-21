"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { login } from "@/features/auth/api/login";
import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type LoginSchema, loginSchema } from "@/features/auth/schema/login-schema";
import { type GraphQLRequestError } from "@/lib/graphql/client";
import { isAuthenticated, saveAuthSession } from "@/lib/auth/session";

type LoginFormProps = {
  embedded?: boolean;
};

const DEFAULT_LOGIN = {
  email: "admin@mundodalua.com",
  password: "Admin@123"
};

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export function LoginForm({ embedded = false }: LoginFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEFAULT_LOGIN.email,
      password: DEFAULT_LOGIN.password
    }
  });

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  async function onSubmit(values: LoginSchema) {
    try {
      const response = await login({
        tenantId: DEFAULT_TENANT_ID,
        email: values.email.trim().toLowerCase(),
        password: values.password
      });

      saveAuthSession({
        token: response.token,
        expiresAt: response.expiresAt,
        user: {
          userId: response.userId,
          name: response.name,
          email: response.email
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

  const content = (
    <>
      <CardHeader className={embedded ? "space-y-1.5 px-0 pt-0" : undefined}>
        <div
          className={
            embedded
              ? "mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              : "mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          }
        >
          <KeyRound className="size-5" />
        </div>
        <CardTitle className={embedded ? "text-2xl font-semibold" : undefined}>
          Entrar no painel
        </CardTitle>
        <CardDescription className={embedded ? "text-sm" : undefined}>
          Acesse o CRM com sua conta corporativa para operar os modulos da instituicao.
        </CardDescription>
      </CardHeader>
      <CardContent className={embedded ? "px-0 pb-0" : undefined}>
        <form className={embedded ? "space-y-4" : "space-y-5"} onSubmit={handleSubmit(onSubmit)}>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              placeholder="voce@mundodalua.com.br"
              type="email"
              {...register("email")}
            />
            {errors.email ? <FieldMessage>{errors.email.message}</FieldMessage> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              placeholder="Digite sua senha"
              type="password"
              {...register("password")}
            />
            {errors.password ? (
              <FieldMessage>{errors.password.message}</FieldMessage>
            ) : (
              <FieldMessage>Use sua credencial com permissao de operador.</FieldMessage>
            )}
          </Field>

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
              <input className="size-4 rounded border-[var(--color-border)]" type="checkbox" />
              Manter conectado
            </label>
            <Link className="font-medium text-[var(--color-primary)]" href="/login">
              Recuperar acesso
            </Link>
          </div>

          <Button
            className="w-full"
            leadingIcon={<ArrowRight className="size-4" />}
            size="lg"
            type="submit"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>

          {errors.root?.message ? (
            <FieldMessage>{errors.root.message}</FieldMessage>
          ) : null}

          <p className="text-xs text-[var(--color-muted-foreground)]">
            Demo: {DEFAULT_LOGIN.email} | {DEFAULT_LOGIN.password}
          </p>
        </form>
      </CardContent>
    </>
  );

  if (embedded) {
    return <div className="w-full">{content}</div>;
  }

  return <Card className="border-white/55 bg-white/80 backdrop-blur-xl">{content}</Card>;
}
