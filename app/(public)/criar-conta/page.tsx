import { SignUpForm } from "@/features/auth/components/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#133d86_0%,#082247_42%,#05162d_100%)] px-4 py-5 md:py-6">
      <div className="relative mx-auto flex h-full w-full max-w-[760px] flex-col items-center justify-center gap-4">
        <header className="space-y-1.5 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Criar conta</h1>
          <p className="text-sm text-[#b9c8e4] md:text-base">Complete as etapas para solicitar seu acesso.</p>
        </header>

        <div className="w-full rounded-[18px] border border-[#d7e3ff] bg-white p-5 shadow-[0_16px_40px_rgba(3,14,34,0.45)] md:p-6">
          <SignUpForm hideHeader />
        </div>

        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#7f92b8]">
          (c) 2026 MUNDO DA LUA
        </p>
      </div>
    </main>
  );
}
