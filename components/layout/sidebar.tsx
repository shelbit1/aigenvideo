"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Factory,
  Film,
  LayoutDashboard,
  Library,
  Settings,
  Sparkles,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { label: "Главная", href: "/dashboard", icon: LayoutDashboard },
  { label: "Проекты", href: "/projects", icon: Film },
  { label: "Новый ролик", href: "/projects/new", icon: Wand2 },
  { label: "Content Factory", href: "/factory", icon: Factory, badge: "new" },
];

const SECONDARY_NAV: NavItem[] = [
  { label: "Библиотека", href: "/library", icon: Library, disabled: true, badge: "скоро" },
  { label: "Настройки", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface/40">
      <div className="flex h-16 items-center px-5">
        <Logo size="md" />
      </div>

      <div className="px-3 pb-3">
        <Link
          href="/projects/new"
          className={cn(
            "group flex items-center justify-between rounded-md border border-border-strong bg-surface-elevated px-3 py-2.5 text-sm font-medium transition-all hover:bg-surface-hover"
          )}
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-4 text-[hsl(var(--accent))]" />
            Создать ролик
          </span>
          <kbd className="hidden md:inline-flex items-center rounded border border-border-strong bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            N
          </kbd>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        <SidebarGroup label="Рабочее">
          {PRIMARY_NAV.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Аккаунт">
          {SECONDARY_NAV.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
        </SidebarGroup>
      </nav>

      <div className="mx-3 mb-4 rounded-lg border border-border bg-surface-elevated p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse" />
          AI движок активен
        </div>
        <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed">
          GPT-5.5 · Flux Pro · Kling 3.0
        </p>
      </div>
    </aside>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {label}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  const content = (
    <span className="flex items-center gap-3">
      <Icon
        className={cn(
          "size-4 transition-colors",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      />
      <span>{item.label}</span>
    </span>
  );

  const classes = cn(
    "group relative flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-all",
    active
      ? "bg-surface-elevated text-foreground"
      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
    item.disabled && "opacity-50 cursor-not-allowed"
  );

  if (item.disabled) {
    return (
      <div className={classes} aria-disabled>
        {content}
        {item.badge && (
          <Badge variant="muted" className="px-1.5 py-0 text-[10px]">
            {item.badge}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Link href={item.href} className={classes}>
      {content}
      {item.badge && (
        <Badge variant="muted" className="px-1.5 py-0 text-[10px]">
          {item.badge}
        </Badge>
      )}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-foreground"
          aria-hidden
        />
      )}
    </Link>
  );
}
