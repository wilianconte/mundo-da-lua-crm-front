"use client";

import type { ComponentType, ReactNode } from "react";

import {
  Bell,
  ChevronRight,
  CircleUserRound,
  Languages,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { MobileSidebarTrigger, SidebarNav } from "@/components/layout/sidebar-nav";
import { clearAuthSession, getAuthUser } from "@/lib/auth/session";
import { APP_VERSION } from "@/lib/app-version";
import { cn } from "@/lib/utils/cn";

type AdminShellProps = {
  children: ReactNode;
};

type BreadcrumbItem = {
  label: string;
  href: string;
  current: boolean;
};

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHoverExpanded, setIsSidebarHoverExpanded] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);
  const [profileName, setProfileName] = useState("Operador");
  const [profileEmail, setProfileEmail] = useState("operador@mundodalua.com");
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const isSidebarCompactForRender = isSidebarCollapsed && !isSidebarHoverExpanded;
  const profileInitials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  useEffect(() => {
    const storedState = window.localStorage.getItem("mdl:sidebar-collapsed");
    setIsSidebarCollapsed(storedState === "true");
  }, []);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      return;
    }

    setProfileName(user.name);
    setProfileEmail(user.email);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("mdl:sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-[var(--color-surface)] text-[var(--color-foreground)]">
      <div className="flex h-full min-h-0">
        <aside
          className={cn(
            "sidebar-theme-dark menu-scroll hidden h-full shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] py-6 transition-[width,padding] duration-200 ease-[var(--ease-standard)] lg:block",
            isSidebarCompactForRender ? "w-20 px-3" : "w-[290px] px-5"
          )}
          onMouseEnter={() => {
            if (isSidebarCollapsed) setIsSidebarHoverExpanded(true);
          }}
          onMouseLeave={() => setIsSidebarHoverExpanded(false)}
        >
          <SidebarContent
            collapsed={isSidebarCompactForRender}
            onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
          />
        </aside>

        <div
          className={cn(
            "fixed inset-0 z-40 bg-[rgba(10,15,28,0.48)] transition lg:hidden",
            isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setIsOpen(false)}
        />

        <aside
          className={cn(
            "sidebar-theme-dark menu-scroll fixed inset-y-0 left-0 z-50 w-[88%] max-w-[320px] border-r border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6 shadow-2xl transition duration-200 ease-[var(--ease-standard)] lg:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <BrandBlock />
            <button
              aria-label="Fechar menu"
              className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)]"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>
          <SidebarNav onNavigate={() => setIsOpen(false)} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-[var(--color-border)]/70 bg-[var(--color-surface)]">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <MobileSidebarTrigger onClick={() => setIsOpen(true)} />
                <HeaderBreadcrumb items={breadcrumbs} />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  aria-label="Notificacoes"
                  className="inline-flex size-9 items-center justify-center text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
                  type="button"
                >
                  <Bell className="size-[18px]" />
                </button>
                <div className="relative" ref={profileMenuRef}>
                  <button
                    aria-expanded={isProfileMenuOpen}
                    aria-label="Perfil do usuario"
                    className="inline-flex size-9 items-center justify-center rounded-full border-2 border-[#14c66a] bg-[var(--color-surface)]"
                    onClick={() => setIsProfileMenuOpen((current) => !current)}
                    type="button"
                  >
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3662f4,#1dbf73)] text-[0.65rem] font-bold text-white">{profileInitials || "MD"}</span>
                  </button>

                  {isProfileMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[300px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
                      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
                        <span className="inline-flex size-12 items-center justify-center rounded-full border-2 border-[#14c66a] bg-[linear-gradient(135deg,#3662f4,#1dbf73)] text-sm font-bold text-white">{profileInitials || "MD"}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-[var(--color-foreground)]">
                            {profileName}
                          </p>
                          <p className="truncate text-sm text-[var(--color-muted-foreground)]">
                            {profileEmail}
                          </p>
                        </div>
                        <span className="rounded-md bg-[var(--color-primary-soft)] px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
                          Pro
                        </span>
                      </div>

                      <div className="space-y-1 border-b border-[var(--color-border)] p-2">
                        <ProfileMenuItem icon={CircleUserRound} label="Meu perfil" />
                        <ProfileMenuItem icon={Settings} label="Minha assinatura" trailingIcon={<ChevronRight className="size-4" />} />
                        <ProfileMenuItem
                          icon={Languages}
                          label="Idioma"
                          trailingContent={
                            <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-1 text-xs font-medium text-[var(--color-foreground)]">
                              English
                            </span>
                          }
                        />
                      </div>

                      <div className="space-y-2 p-3">
                        <div className="flex items-center justify-between rounded-[var(--radius-md)] px-2 py-2 text-[0.95rem] font-medium text-[var(--color-foreground)]">
                          <span className="flex items-center gap-3">
                            <Moon className="size-4 text-[var(--color-muted-foreground)]" />
                            Dark Mode
                          </span>
                          <button
                            aria-label="Alternar dark mode"
                            className={cn(
                              "relative h-6 w-10 rounded-full transition",
                              isDarkModeEnabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                            )}
                            onClick={() => setIsDarkModeEnabled((current) => !current)}
                            type="button"
                          >
                            <span
                              className={cn(
                                "absolute top-1 size-4 rounded-full bg-white transition",
                                isDarkModeEnabled ? "left-5" : "left-1"
                              )}
                            />
                          </button>
                        </div>

                        <button
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-sm font-semibold text-[var(--color-foreground)]"
                          onClick={async () => {
                            await clearAuthSession();
                            setIsProfileMenuOpen(false);
                            router.replace("/login");
                          }}
                          type="button"
                        >
                          <LogOut className="size-4" />
                          Sair
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  collapsed,
  onToggleCollapse
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  if (collapsed) {
    return (
      <>
        <div className="mb-4 flex justify-center">
          <button
            aria-label="Expandir menu"
            className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-transparent text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
            onClick={onToggleCollapse}
            title="Expandir menu"
            type="button"
          >
            <PanelLeftOpen className="size-5" />
          </button>
        </div>
        <div className="space-y-4">
          <SidebarNav collapsed />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="relative mb-5 flex min-h-12 items-center">
        <BrandBlock />
        <button
          aria-label="Compactar menu"
          className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center p-1 text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
          onClick={onToggleCollapse}
          title="Compactar menu"
          type="button"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>
      <div className="space-y-3">
        <SidebarNav />
      </div>
    </>
  );
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex justify-center">
        <Link
          aria-label="Ir para home"
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-bold tracking-[0.08em] text-[var(--color-foreground)]"
          href="/"
        >
          MDL
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-1">
      <Link
        aria-label="Ir para home"
        className="inline-flex flex-col items-start"
        href="/"
      >
        <span className="text-[0.78rem] uppercase tracking-[0.22em] text-[var(--color-muted-foreground)]">
          MUNDO DA LUA CRM
        </span>
        <span className="text-[1.15rem] font-semibold leading-tight text-[var(--color-foreground)]">
          Painel administrativo
        </span>
        <span className="mt-1 inline-flex py-0.5 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
          v{APP_VERSION}
        </span>
      </Link>
    </div>
  );
}

function ProfileMenuItem({
  icon: Icon,
  label,
  trailingContent,
  trailingIcon
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  trailingContent?: ReactNode;
  trailingIcon?: ReactNode;
}) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-[var(--radius-md)] px-2 py-2 text-[0.95rem] font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-surface-muted)]"
      type="button"
    >
      <span className="flex items-center gap-3">
        <Icon className="size-4 text-[var(--color-muted-foreground)]" />
        {label}
      </span>
      {trailingContent ?? trailingIcon}
    </button>
  );
}

function HeaderBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm text-[var(--color-muted-foreground)]">
        {items.map((item, index) => (
          <li className="flex min-w-0 items-center gap-1.5" key={item.href}>
            {index > 0 ? <ChevronRight className="size-3.5 shrink-0 opacity-60" /> : null}
            {item.current ? (
              <span className="truncate font-medium text-[var(--color-foreground)]">{item.label}</span>
            ) : (
              <Link
                className="truncate transition hover:text-[var(--color-foreground)]"
                href={item.href}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const cleanPath = pathname.split("?")[0].split("#")[0];
  const segments = cleanPath.split("/").filter(Boolean);

  if (!segments.length) {
    return [{ label: "Dashboard", href: "/", current: true }];
  }

  const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/", current: false }];
  let hrefAccumulator = "";

  segments.forEach((segment, index) => {
    hrefAccumulator += `/${segment}`;
    items.push({
      label: toBreadcrumbLabel(segment),
      href: hrefAccumulator,
      current: index === segments.length - 1
    });
  });

  return items;
}

function toBreadcrumbLabel(segment: string) {
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    pessoas: "Pessoas",
    empresas: "Empresas",
    alunos: "Alunos",
    cursos: "Cursos",
    courses: "Cursos",
    new: "Novo",
    edit: "Editar",
    pacientes: "Pacientes",
    componentes: "Componentes",
    "system-design": "System Design",
    pesquisa: "Pesquisa",
    cadastro: "Cadastro",
    login: "Login"
  };

  const normalized = segment.toLowerCase();
  if (labels[normalized]) {
    return labels[normalized];
  }

  return normalized
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
