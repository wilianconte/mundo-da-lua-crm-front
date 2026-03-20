"use client";

import { Menu, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { NavItem } from "@/config/navigation";
import { navigationItems } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";

type SidebarNavProps = {
  className?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
};

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
  const [expanded, setExpanded] = useState(
    item.defaultExpanded || item.children?.some((child) => child.href === pathname) || false
  );
  const Icon = item.icon;
  const isActive = item.href ? pathname === item.href : expanded;

  if (collapsed) {
    const href = item.href ?? item.children?.[0]?.href ?? "#";

    return (
      <Link
        aria-label={item.label}
        className={cn(
          "flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-transparent transition hover:bg-transparent",
          isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"
        )}
        href={href}
        onClick={onNavigate}
        title={item.label}
      >
        <Icon className="size-5" />
      </Link>
    );
  }

  if (item.children?.length) {
    return (
      <div className="space-y-1">
        <button
          className={cn(
            "flex w-full items-center justify-between rounded-[var(--radius-md)] px-2 py-2 text-left text-base font-bold transition hover:bg-[var(--color-surface-muted)]/75",
            isActive
              ? "text-[var(--color-foreground)]"
              : "text-[var(--color-foreground)]"
          )}
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <span className="flex items-center gap-3">
            <Icon className="size-[1.05rem] text-[var(--color-muted-foreground)]" />
            <span className="text-base font-bold">{item.label}</span>
          </span>
          {expanded ? (
            <Minus className="size-4 text-[var(--color-muted-foreground)]" />
          ) : (
            <Plus className="size-4 text-[var(--color-muted-foreground)]" />
          )}
        </button>
        {expanded ? (
          <div className="ml-[0.95rem] space-y-1 border-l border-[var(--color-border)]/85 pl-5 pt-1">
            {item.children.map((child) => {
              const isChildActive = pathname === child.href;

              return (
                <Link
                  className={cn(
                    "flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-[0.98rem] font-medium transition hover:bg-[var(--color-surface-muted)]/75",
                    isChildActive
                      ? "text-[var(--color-foreground)]"
                      : "text-[var(--color-foreground)]"
                  )}
                  href={child.href}
                  key={child.label}
                  onClick={onNavigate}
                >
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      className={cn(
        "flex items-center justify-between rounded-[var(--radius-md)] px-2 py-2 text-base font-bold transition hover:bg-[var(--color-surface-muted)]/75",
        isActive
          ? "text-[var(--color-foreground)]"
          : "text-[var(--color-foreground)]"
      )}
      href={item.href ?? "#"}
      onClick={onNavigate}
    >
      <span className="flex items-center gap-3">
        <Icon className="size-[1.05rem] text-[var(--color-muted-foreground)]" />
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
  const groupedItems = navigationItems.reduce<Array<{ section?: string; items: NavItem[] }>>(
    (accumulator, item) => {
      const currentGroup = accumulator[accumulator.length - 1];

      if (currentGroup && currentGroup.section === item.section) {
        currentGroup.items.push(item);
        return accumulator;
      }

      accumulator.push({ section: item.section, items: [item] });
      return accumulator;
    },
    []
  );

  return (
    <nav className={cn("space-y-4", collapsed && "space-y-3", className)}>
      {groupedItems.map((group, index) => (
        <div className={cn("space-y-1", collapsed && "space-y-3")} key={`${group.section ?? "root"}-${index}`}>
          {collapsed ? (
            <div className="h-px w-full bg-[var(--color-border)]/70" />
          ) : group.section ? (
            <p className="px-2 pt-2 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
              {group.section}
            </p>
          ) : null}
          {group.items.map((item) => (
            <SidebarLink
              collapsed={collapsed}
              item={item}
              key={item.label}
              onNavigate={onNavigate}
              pathname={pathname}
            />
          ))}
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
