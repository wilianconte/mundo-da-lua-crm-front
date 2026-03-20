import { Building2, CircleCheckBig, ShieldEllipsis } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LoginForm } from "@/features/auth/components/login-form";

const highlights = [
  "Acesso por perfil administrativo e operacional",
  "Tema preparado para branding futuro por tenant",
  "Fluxo pronto para integrar autenticacao segura por cookie"
];

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-y-auto p-4 lg:h-screen lg:overflow-hidden lg:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl items-center lg:h-full">
        <section className="grid w-full overflow-hidden rounded-[32px] border border-white/50 bg-white/70 shadow-2xl backdrop-blur lg:h-[calc(100vh-2.5rem)] lg:max-h-[820px] lg:grid-cols-[1.45fr_0.95fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(150deg,#0f172a_0%,#102f73_45%,#0f766e_100%)] px-6 py-7 text-white md:px-8 md:py-8 lg:px-9 lg:py-9">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%)]" />
            <div className="absolute -bottom-20 -left-16 size-72 rounded-full bg-white/6 blur-xl" />
            <div className="absolute -right-12 top-1/3 size-40 rounded-full bg-white/8 blur-lg" />

            <div className="relative space-y-6">
              <Badge className="bg-white/12 text-white" variant="neutral">
                Novo front administrativo
              </Badge>

              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-[3.2rem]">
                  Administracao elegante para operacoes que exigem ritmo.
                </h1>
                <p className="max-w-xl text-base text-slate-100/90 md:text-lg md:leading-7">
                  Um CRM de alta densidade operacional para escola, clinica e financeiro,
                  desenhado para produtividade, leitura rapida e crescimento por modulo.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[var(--radius-lg)] border border-white/12 bg-white/12 p-3.5 backdrop-blur-sm">
                  <Building2 className="mb-3 size-5" />
                  <p className="font-medium">Multioperacao</p>
                  <p className="mt-2 text-sm text-slate-100/84">
                    Escola, clinica e financeiro em um mesmo cockpit.
                  </p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-white/12 bg-white/12 p-3.5 backdrop-blur-sm">
                  <ShieldEllipsis className="mb-3 size-5" />
                  <p className="font-medium">Controle seguro</p>
                  <p className="mt-2 text-sm text-slate-100/84">
                    Preparado para sessao segura e governanca por tenant.
                  </p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-white/12 bg-white/12 p-3.5 backdrop-blur-sm">
                  <CircleCheckBig className="mb-3 size-5" />
                  <p className="font-medium">Design consistente</p>
                  <p className="mt-2 text-sm text-slate-100/84">
                    Tokens de tema e componentes reutilizaveis desde o bootstrap.
                  </p>
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-sm font-medium text-white/90">Base entregue neste bootstrap</p>
                <ul className="mt-2 space-y-2 text-[0.92rem] text-slate-100/86">
                  {highlights.map((item) => (
                    <li className="flex items-start gap-3" key={item}>
                      <span className="mt-1 size-2 rounded-full bg-[var(--color-secondary-soft)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center bg-[var(--color-surface)] px-6 py-7 md:px-8 md:py-8 lg:px-9 lg:py-9">
            <LoginForm embedded />
          </div>
        </section>
      </div>
    </main>
  );
}
