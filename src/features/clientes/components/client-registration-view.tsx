"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Save, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FieldLabel, FieldMessage } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type ClientRegistrationSchema,
  clientRegistrationSchema
} from "@/features/clientes/schema/client-registration-schema";

export function ClientRegistrationView() {
  const [isSaved, setIsSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ClientRegistrationSchema>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      document: "",
      birthDate: "",
      city: "",
      state: "",
      address: "",
      notes: ""
    }
  });

  async function onSubmit(values: ClientRegistrationSchema) {
    console.log("Novo cliente:", values);
    setIsSaved(true);
  }

  function handleClear() {
    reset();
    setIsSaved(false);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
          Clientes
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Cadastro de cliente</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Preencha os dados principais para criar um novo cliente na base.
        </p>
      </section>

      {isSaved ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-success-soft)] px-4 py-3 text-sm font-medium text-[var(--color-success-strong)]">
          <CheckCircle2 className="size-4" />
          Cliente salvo com sucesso no ambiente de demonstracao.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Novo cadastro</CardTitle>
              <CardDescription>Dados de identificacao e contato do cliente.</CardDescription>
            </div>
            <Badge variant="attention">Obrigatorio</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fullName">Nome completo</FieldLabel>
                <Input id="fullName" placeholder="Ex: Maria da Silva" {...register("fullName")} />
                {errors.fullName ? <FieldMessage>{errors.fullName.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="document">CPF/CNPJ</FieldLabel>
                <Input id="document" placeholder="000.000.000-00" {...register("document")} />
                {errors.document ? <FieldMessage>{errors.document.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" placeholder="cliente@email.com" {...register("email")} />
                {errors.email ? <FieldMessage>{errors.email.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Telefone</FieldLabel>
                <Input id="phone" placeholder="(11) 98888-7777" {...register("phone")} />
                {errors.phone ? <FieldMessage>{errors.phone.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="birthDate">Data de nascimento</FieldLabel>
                <Input id="birthDate" type="date" {...register("birthDate")} />
                {errors.birthDate ? <FieldMessage>{errors.birthDate.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="city">Cidade</FieldLabel>
                <Input id="city" placeholder="Sao Paulo" {...register("city")} />
                {errors.city ? <FieldMessage>{errors.city.message}</FieldMessage> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="state">UF</FieldLabel>
                <Input id="state" maxLength={2} placeholder="SP" {...register("state")} />
                {errors.state ? <FieldMessage>{errors.state.message}</FieldMessage> : null}
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="address">Endereco</FieldLabel>
                <Input
                  id="address"
                  placeholder="Rua, numero, bairro e complemento"
                  {...register("address")}
                />
                {errors.address ? <FieldMessage>{errors.address.message}</FieldMessage> : null}
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="notes">Observacoes</FieldLabel>
                <textarea
                  className="min-h-28 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition duration-200 ease-[var(--ease-standard)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
                  id="notes"
                  placeholder="Informacoes adicionais para atendimento"
                  {...register("notes")}
                />
                {errors.notes ? <FieldMessage>{errors.notes.message}</FieldMessage> : null}
              </Field>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="min-w-40"
                leadingIcon={<Save className="size-4" />}
                size="lg"
                type="submit"
              >
                {isSubmitting ? "Salvando..." : "Salvar cliente"}
              </Button>
              <Button
                className="min-w-40"
                leadingIcon={<UserPlus className="size-4" />}
                onClick={handleClear}
                size="lg"
                type="button"
                variant="outline"
              >
                Limpar formulario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
