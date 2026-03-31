"use client";

import { Menu, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { NavChildItem, NavItem } from "@/config/navigation";
import { navigationItems } from "@/config/navigation";
import { SYSTEM_PERMISSIONS, canAccessPath } from "@/lib/auth/permissions";
import { getAuthUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

type SidebarNavProps = {
  className?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
};

function isAdminUser(permissions: string[]) {
  return (
    permissions.includes(SYSTEM_PERMISSIONS.usersManage) &&
    permissions.includes(SYSTEM_PERMISSIONS.rolesManage)
  );
}

function isUnimplementedMenuItem(href?: string) {
  return href === "/components" || href?.startsWith("/system-design") === true;
}

function filterChildrenByPermissions(items: NavChildItem[], permissions: string[], isAdmin: boolean): NavChildItem[] {
  return items
    .map((item) => {
      const nextChildren = item.children?.length
        ? filterChildrenByPermissions(item.children, permissions, isAdmin)
        : undefined;

      if (isUnimplementedMenuItem(item.href) && !isAdmin) {
        return null;
      }

      const hasHrefAccess = item.href ? canAccessPath(item.href, permissions) : false;
      const hasVisibleChildren = Boolean(nextChildren?.length);
      if (!hasHrefAccess && !hasVisibleChildren) {
        return null;
      }

      return {
        ...item,
        children: nextChildren
      };
    })
    .filter((item): item is NavChildItem => Boolean(item));
}

function filterNavigationByPermissions(items: NavItem[], permissions: string[]): NavItem[] {
  const isAdmin = isAdminUser(permissions);

  return items
    .map((item) => {
      const nextChildren = item.children?.length
        ? filterChildrenByPermissions(item.children, permissions, isAdmin)
        : undefined;

      if (isUnimplementedMenuItem(item.href) && !isAdmin) {
        return null;
      }

      const hasHrefAccess = item.href ? canAccessPath(item.href, permissions) : false;
      const hasVisibleChildren = Boolean(nextChildren?.length);
      if (!hasHrefAccess && !hasVisibleChildren) {
        return null;
      }

      return {
        ...item,
        children: nextChildren
      };
    })
    .filter((item): item is NavItem => Boolean(item));
}

function getFirstHref(items?: NavChildItem[]): string | undefined {
  if (!items?.length) {
    return undefined;
  }

  for (const item of items) {
    if (item.href) {
      return item.href;
    }

    const nestedHref = getFirstHref(item.children);
    if (nestedHref) {
      return nestedHref;
    }
  }

  return undefined;
}

function isPathActive(pathname: string, href?: string): boolean {
  if (!href) {
    return false;
  }

  if (pathname === href) {
    return true;
  }

  if (href.endsWith("/pesquisa") || href.endsWith("/cadastro")) {
    const parentPath = href.replace(/\/(pesquisa|cadastro)$/, "");
    if (!parentPath) {
      return false;
    }

    return pathname === parentPath || pathname.startsWith(`${parentPath}/`);
  }

  return false;
}

function hasActivePath(items: NavChildItem[] | undefined, pathname: string): boolean {
  if (!items?.length) {
    return false;
  }

  return items.some((item) => isPathActive(pathname, item.href) || hasActivePath(item.children, pathname));
}

function ChildNavItem({
  item,
  pathname,
  onNavigate,
  level
}: {
  item: NavChildItem;
  pathname: string;
  onNavigate?: () => void;
  level: number;
}) {
  const hasChildren = Boolean(item.children?.length);
  const isChildActive = isPathActive(pathname, item.href);
  const [expanded, setExpanded] = useState(hasActivePath(item.children, pathname));

  if (hasChildren) {
    const isGroupActive = hasActivePath(item.children, pathname);

    return (
      <div className="space-y-1">
        <button
          data-active={isGroupActive ? "true" : "false"}
          className={cn(
            "submenu-item flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left font-medium transition hover:bg-[var(--color-surface-muted)]",
            level > 1 ? "text-[0.94rem]" : "text-[0.98rem]",
            isGroupActive ? "bg-[var(--color-surface-muted)]" : ""
          )}
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <span>{item.label}</span>
          {expanded ? (
            <Minus className="size-3.5 submenu-item-icon" />
          ) : (
            <Plus className="size-3.5 submenu-item-icon" />
          )}
        </button>
        {expanded ? (
          <div className="ml-[0.8rem] space-y-1 border-l border-[var(--color-border-strong)] pl-4">
            {item.children?.map((nestedChild) => (
              <ChildNavItem
                item={nestedChild}
                key={`${item.label}-${nestedChild.label}`}
                level={level + 1}
                onNavigate={onNavigate}
                pathname={pathname}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      data-active={isChildActive ? "true" : "false"}
      className={cn(
        "submenu-item flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-[0.98rem] font-medium transition hover:bg-[var(--color-surface-muted)]",
        isChildActive ? "bg-[var(--color-primary-soft)]" : ""
      )}
      href={item.href ?? "#"}
      onClick={onNavigate}
    >
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarLink({
  collapsed = false,
  item,
  pathname,
  onNavigate
}: {
  collapsed?: boolean;
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const [expanded, setExpanded] = useState(item.defaultExpanded || hasActivePath(item.children, pathname) || false);
  const Icon = item.icon;
  const isActive = item.href ? isPathActive(pathname, item.href) : expanded;

  if (collapsed) {
    const href = item.href ?? getFirstHref(item.children) ?? "#";

    return (
      <Link
        aria-label={item.label}
        data-active={isActive ? "true" : "false"}
        className={cn(
          "menu-item flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-transparent transition hover:bg-transparent"
        )}
        href={href}
        onClick={onNavigate}
        title={item.label}
      >
        <Icon className="size-5 menu-item-icon" />
      </Link>
    );
  }

  if (item.children?.length) {
    return (
      <div className="space-y-1">
        <button
          data-active={isActive ? "true" : "false"}
          className={cn(
            "menu-item flex w-full items-center justify-between rounded-[var(--radius-md)] px-2 py-2 text-left text-base font-bold transition hover:bg-[var(--color-surface-muted)]/75",
            isActive ? "bg-[var(--color-surface-muted)]" : ""
          )}
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <span className="flex items-center gap-3">
            <Icon className="size-[1.05rem] menu-item-icon" />
            <span className="text-base font-bold">{item.label}</span>
          </span>
          {expanded ? (
            <Minus className="size-4 menu-item-icon" />
          ) : (
            <Plus className="size-4 menu-item-icon" />
          )}
        </button>
        {expanded ? (
          <div className="ml-[0.95rem] space-y-1 border-l border-[var(--color-border)]/85 pl-5 pt-1">
            {item.children.map((child) => (
              <ChildNavItem
                item={child}
                key={`${item.label}-${child.label}`}
                level={1}
                onNavigate={onNavigate}
                pathname={pathname}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      data-active={isActive ? "true" : "false"}
      className={cn(
        "menu-item flex items-center justify-between rounded-[var(--radius-md)] px-2 py-2 text-base font-bold transition hover:bg-[var(--color-surface-muted)]/75",
        isActive ? "bg-[var(--color-surface-muted)]" : ""
      )}
      href={item.href ?? "#"}
      onClick={onNavigate}
    >
      <span className="flex items-center gap-3">
        <Icon className="size-[1.05rem] menu-item-icon" />
        <span>{item.label}</span>
      </span>
      <span className="flex items-center gap-2">
        {item.badge ? (
          <span className="rounded-md bg-[var(--color-surface-muted)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-muted-foreground)]">
            {item.badge}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function SidebarNav({ className, collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const [userPermissions, setUserPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    setUserPermissions(getAuthUser()?.permissions ?? []);
  }, []);

  const allowedNavigationItems = useMemo(
    () =>
      userPermissions && userPermissions.length
        ? filterNavigationByPermissions(navigationItems, userPermissions)
        : navigationItems,
    [userPermissions]
  );
  const groupedItems = useMemo(
    () =>
      allowedNavigationItems.reduce<Array<{ section?: string; items: NavItem[] }>>((accumulator, item) => {
        const currentGroup = accumulator[accumulator.length - 1];

        if (currentGroup && currentGroup.section === item.section) {
          currentGroup.items.push(item);
          return accumulator;
        }

        accumulator.push({ section: item.section, items: [item] });
        return accumulator;
      }, []),
    [allowedNavigationItems]
  );
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  return (
    <nav className={cn("space-y-4", collapsed && "space-y-3", className)}>
      {groupedItems.map((group, index) => (
        <div className={cn("space-y-1", collapsed && "space-y-3")} key={`${group.section ?? "root"}-${index}`}>
          {collapsed ? (
            <div className="h-px w-full bg-[var(--color-border)]/70" />
          ) : group.section ? (
            <button
              aria-expanded={!(collapsedSections[group.section] ?? false)}
              className="flex w-full items-center justify-between px-2 pt-2 text-left text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]"
              onClick={() => {
                const section = group.section;

                if (!section) {
                  return;
                }

                setCollapsedSections((current) => ({
                  ...current,
                  [section]: !(current[section] ?? false)
                }));
              }}
              type="button"
            >
              <span>{group.section}</span>
              {!(collapsedSections[group.section] ?? false) ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
            </button>
          ) : null}
          {!group.section || !(collapsedSections[group.section] ?? false)
            ? group.items.map((item) => (
                <SidebarLink
                  collapsed={collapsed}
                  item={item}
                  key={item.label}
                  onNavigate={onNavigate}
                  pathname={pathname}
                />
              ))
            : null}
        </div>
      ))}
    </nav>
  );
}

export function MobileSidebarTrigger({
  onClick
}: {
  onClick: () => void;
}) {
  return (
    <button
      aria-label="Abrir menu"
      className="inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-soft)] lg:hidden"
      onClick={onClick}
      type="button"
    >
      <Menu className="size-5" />
    </button>
  );
}
