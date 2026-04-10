"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMyPermissionsWithToken } from "@/features/auth/api/get-my-permissions";
import { canAccessPath, getFirstAccessiblePath } from "@/lib/auth/permissions";
import { clearAuthSession, getAuthUser, getValidToken, isAuthenticated, updateAuthUser } from "@/lib/auth/session";
import { GraphQLRequestError } from "@/lib/graphql/client";

type DashboardAuthGuardProps = {
  children: React.ReactNode;
};

function parseBooleanClaim(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : null;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
}

function getJwtAdminClaim(token: string | null): boolean | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
    return parseBooleanClaim(decoded["is_admin"]);
  } catch {
    return null;
  }
}

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      if (!isMounted) return;
      setIsCheckingAccess(true);

      if (!isAuthenticated()) {
        setIsAuthorized(false);
        router.replace("/login");
        return;
      }

      const user = getAuthUser();
      if (!user) {
        setIsAuthorized(false);
        router.replace("/login");
        return;
      }

      const token = getValidToken();
      const isAdminFromToken = getJwtAdminClaim(token);
      const isAdmin = user.isAdmin || isAdminFromToken === true;

      if (isAdmin) {
        setIsAuthorized(true);
        setIsCheckingAccess(false);
        return;
      }

      let permissions = user.permissions ?? [];
      if (permissions.length === 0) {
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
          if (error instanceof GraphQLRequestError) {
            // Falha fechada: sem permissoes confiaveis, a rota privada nao deve abrir.
            await clearAuthSession();
            setIsAuthorized(false);
            router.replace("/login");
            return;
          }

          await clearAuthSession();
          setIsAuthorized(false);
          router.replace("/login");
          return;
        }
      }

      if (permissions.length === 0) {
        await clearAuthSession();
        setIsAuthorized(false);
        router.replace("/login");
        return;
      }

      if (!user.isAdmin && !canAccessPath(pathname, permissions)) {
        setIsAuthorized(false);
        router.replace(getFirstAccessiblePath(permissions));
        return;
      }

      setIsAuthorized(true);
      setIsCheckingAccess(false);
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

  if (isCheckingAccess || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
