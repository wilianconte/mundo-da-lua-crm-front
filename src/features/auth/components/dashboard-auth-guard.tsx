"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { getMyPermissionsWithToken } from "@/features/auth/api/get-my-permissions";
import { canAccessPath, getFirstAccessiblePath } from "@/lib/auth/permissions";
import { getAuthUser, getValidToken, isAuthenticated, updateAuthUser } from "@/lib/auth/session";
import { GraphQLRequestError } from "@/lib/graphql/client";

type DashboardAuthGuardProps = {
  children: React.ReactNode;
};

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      if (!isAuthenticated()) {
        router.replace("/login");
        return;
      }

      const user = getAuthUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      let permissions = user.permissions ?? [];
      if (permissions.length === 0) {
        const token = getValidToken();
        if (!token) {
          router.replace("/login");
          return;
        }

        try {
          permissions = await getMyPermissionsWithToken(token);
          if (!isMounted) return;
          updateAuthUser({ ...user, permissions });
        } catch (error) {
          if (!isMounted) return;
          // Fallback: em alguns ambientes o endpoint de permissoes pode falhar mesmo com login valido.
          // Nesses casos, mantemos a sessao e deixamos o backend aplicar a autorizacao final por policy.
          if (error instanceof GraphQLRequestError) {
            return;
          }
          return;
        }
      }

      if (permissions.length === 0) {
        return;
      }

      if (!canAccessPath(pathname, permissions)) {
        router.replace(getFirstAccessiblePath(permissions));
      }
    }

    void validateSession();
    const intervalId = window.setInterval(() => {
      void validateSession();
    }, 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [pathname, router]);

  return <>{children}</>;
}
