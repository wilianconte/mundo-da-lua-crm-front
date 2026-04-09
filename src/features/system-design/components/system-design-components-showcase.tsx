"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Plus, Save, Search, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SystemDesignComponentsShowcase() {
  const [isDeleteConfirmExampleOpen, setIsDeleteConfirmExampleOpen] = useState(false);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">Objetivo</p>
            <p className="text-sm text-[var(--color-foreground)]">
              Garantir consistencia visual e comportamento previsivel entre telas.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
              Acessibilidade
            </p>
            <p className="text-sm text-[var(--color-foreground)]">
              Todos os exemplos incluem foco visivel e semantica correta de botoes.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
              Reutilizacao
            </p>
            <p className="text-sm text-[var(--color-foreground)]">
              Sempre prefira componentes de `ui/` ao inves de classes avulsas por pagina.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">Paleta</p>
            <p className="text-sm text-[var(--color-foreground)]">
              Botoes primarios seguem a mesma familia de azul definida pelo menu lateral.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Botoes por variante</CardTitle>
            <CardDescription>
              Variantes padrao para acao principal, secundaria, neutra e de contorno.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button leadingIcon={<Plus className="size-4" />}>Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="outline">Outline</Button>
            <Button leadingIcon={<Trash2 className="size-4" />} variant="danger-outline">Danger outline</Button>
            <Button variant="ghost">Ghost</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Botoes por tamanho</CardTitle>
            <CardDescription>Escolha o tamanho conforme densidade e hierarquia da tela.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acoes de formulario (padrao)</CardTitle>
            <CardDescription>
              Identidade oficial para botoes de Salvar, Cancelar e Excluir em cadastros.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button leadingIcon={<Save className="size-4" />}>Salvar</Button>
            <Button leadingIcon={<X className="size-4" />} variant="outline">Cancelar</Button>
            <Button leadingIcon={<Trash2 className="size-4" />} variant="danger-outline">Excluir</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estados de interacao</CardTitle>
            <CardDescription>Exemplos de estado padrao, carregando e desabilitado.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button leadingIcon={<Search className="size-4" />}>Buscar</Button>
            <Button disabled leadingIcon={<Loader2 className="size-4 animate-spin" />}>
              Carregando
            </Button>
            <Button disabled variant="outline">
              Desabilitado
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exemplo de composicao</CardTitle>
            <CardDescription>
              Layout comum de lista com campo de busca, status e acoes de toolbar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input className="max-w-sm" placeholder="Buscar componente..." />
              <Button leadingIcon={<Plus className="size-4" />}>Novo</Button>
              <Button variant="outline">Exportar</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Ativo</Badge>
              <Badge variant="attention">Revisao</Badge>
              <Button size="sm" variant="ghost">
                <Trash2 className="size-4" />
                Remover
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modal de confirmacao (delecao)</CardTitle>
            <CardDescription>Toda delecao deve abrir modal de confirmacao antes da acao destrutiva.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              leadingIcon={<Trash2 className="size-4" />}
              onClick={() => setIsDeleteConfirmExampleOpen(true)}
              variant="danger-outline"
            >
              Abrir modal de confirmacao
            </Button>
            <pre className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-muted-foreground)]">
{`<Button variant="danger-outline" onClick={() => setOpen(true)}>
  Excluir
</Button>`}
            </pre>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Checklist de boas praticas</CardTitle>
          <CardDescription>
            Recomendacoes para manter consistencia de UX e acessibilidade nos botoes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p className="flex items-start gap-2 text-sm text-[var(--color-foreground)]">
            <CheckCircle2 className="mt-0.5 size-4 text-[var(--color-secondary-strong)]" />
            Use texto orientado a acao: ex. &quot;Salvar&quot;, &quot;Filtrar&quot;, &quot;Novo cadastro&quot;.
          </p>
          <p className="flex items-start gap-2 text-sm text-[var(--color-foreground)]">
            <CheckCircle2 className="mt-0.5 size-4 text-[var(--color-secondary-strong)]" />
            Garanta apenas uma acao primaria por area para reforcar hierarquia visual.
          </p>
          <p className="flex items-start gap-2 text-sm text-[var(--color-foreground)]">
            <CheckCircle2 className="mt-0.5 size-4 text-[var(--color-secondary-strong)]" />
            Em formularios, use `type=&quot;submit&quot;` na acao principal e `type=&quot;button&quot;` nas
            auxiliares.
          </p>
          <p className="flex items-start gap-2 text-sm text-[var(--color-foreground)]">
            <CheckCircle2 className="mt-0.5 size-4 text-[var(--color-secondary-strong)]" />
            Use estado `disabled` durante requests para evitar envio duplicado.
          </p>
        </CardContent>
      </Card>

      {isDeleteConfirmExampleOpen ? (
        <div
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="space-y-2">
              <p className="text-base font-semibold text-[var(--color-foreground)]">Confirmar exclusao</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Este e o padrao oficial de confirmacao antes de deletar qualquer registro.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button leadingIcon={<X className="size-4" />} onClick={() => setIsDeleteConfirmExampleOpen(false)} variant="outline">
                Cancelar
              </Button>
              <Button leadingIcon={<Trash2 className="size-4" />} onClick={() => setIsDeleteConfirmExampleOpen(false)} variant="danger-outline">
                Excluir
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
