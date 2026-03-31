"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { isAuthenticated } from "@/lib/auth/session";

type DashboardAuthGuardProps = {
  children: React.ReactNode;
};

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    function validateSession() {
      if (!isAuthenticated()) {
        router.replace("/login");
      }
    }

    validateSession();
    const intervalId = window.setInterval(validateSession, 30_000);

    return () => window.clearInterval(intervalId);
  }, [router]);

  return <>{children}</>;
}
