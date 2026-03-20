import { Bell, Layers3, Palette, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const tokens = [
  { name: "Primary", value: "var(--color-primary)", detail: "Acoes principais e foco" },
  { name: "Secondary", value: "var(--color-secondary)", detail: "Destaques complementares" },
  { name: "Surface", value: "var(--color-surface)", detail: "Base dos cards e paineis" },
  { name: "Foreground", value: "var(--color-foreground)", detail: "Leitura de interface" }
];

export function ComponentsShowcase() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Biblioteca visual inicial</CardTitle>
            <CardDescription>
              Esta area serve como referencia para novos componentes do admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button>Acao primaria</Button>
              <Button variant="secondary">Acao secundaria</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Input base</p>
                <Input placeholder="Buscar componente" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Badges</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>Neutro</Badge>
                  <Badge variant="attention">Destaque</Badge>
                  <Badge variant="success">Ativo</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paleta themable</CardTitle>
            <CardDescription>
              Os tokens abaixo podem ser alterados depois sem quebrar a estrutura.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {tokens.map((token) => (
              <div
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
                key={token.name}
              >
                <div>
                  <p className="font-medium">{token.name}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{token.detail}</p>
                </div>
                <code className="rounded bg-[var(--color-surface-muted)] px-3 py-1 text-xs">
                  {token.value}
                </code>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Cards",
            detail: "Containers de resumo e secoes densas",
            icon: Layers3
          },
          {
            title: "Feedback",
            detail: "Alertas, badges e estados futuros",
            icon: Bell
          },
          {
            title: "Seguranca",
            detail: "A base considera contexto de admin e tenant",
            icon: ShieldCheck
          },
          {
            title: "Tema",
            detail: "Tokens centrais para personalizacao posterior",
            icon: Palette
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title}>
              <CardContent className="space-y-4 p-5">
                <div className="inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-secondary-soft)] text-[var(--color-secondary-strong)]">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{item.detail}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
