"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isAuthenticated } from "@/lib/auth/session";

type DashboardAuthGuardProps = {
  children: React.ReactNode;
};

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function validateSession() {
      if (!isAuthenticated()) {
        router.replace("/login");
        return;
      }

      setIsReady(true);
    }

    validateSession();
    const intervalId = window.setInterval(validateSession, 30_000);

    return () => window.clearInterval(intervalId);
  }, [router]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
