import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#133d86_0%,#082247_42%,#05162d_100%)] px-4 py-6 md:py-8">
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[380px] flex-col items-center justify-center gap-6">
        <header className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white">Mundo da Lua CRM</h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.28em] text-[#b9c8e4]">
            Sistemas Corporativos Inteligentes
          </p>
        </header>

        <div className="w-full rounded-[18px] border border-[#d7e3ff] bg-white p-7 shadow-[0_16px_40px_rgba(3,14,34,0.45)] md:p-8">
          <ForgotPasswordForm />
        </div>

        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#7f92b8]">
          (c) 2026 MUNDO DA LUA
        </p>
      </div>
    </main>
  );
}
