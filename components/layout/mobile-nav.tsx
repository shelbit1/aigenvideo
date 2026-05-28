"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Factory,
  Film,
  LayoutDashboard,
  Library,
  Menu,
  Settings,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  user: { name?: string | null; email?: string | null };
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

const NAV: NavItem[] = [
  { label: "Главная", href: "/dashboard", icon: LayoutDashboard },
  { label: "Проекты", href: "/projects", icon: Film },
  { label: "Новый ролик", href: "/projects/new", icon: Wand2 },
  { label: "Content Factory", href: "/factory", icon: Factory, badge: "new" },
  { label: "Библиотека", href: "/library", icon: Library, badge: "скоро", disabled: true },
  { label: "Настройки", href: "/settings", icon: Settings },
];

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Меню"
          className="lg:hidden inline-flex items-center justify-center rounded-md size-9 hover:bg-surface-hover transition-colors"
        >
          <Menu className="size-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm sm:rounded-xl p-0 overflow-hidden border-border-strong">
        <div className="border-b border-border px-5 py-4">
          <DialogTitle className="sr-only">Навигация</DialogTitle>
          <Logo size="md" />
        </div>

        <div className="px-3 py-3">
          <Link
            href="/projects/new"
            className="group flex items-center gap-2 rounded-md border border-border-strong bg-surface-elevated px-3 py-2.5 text-sm font-medium hover:bg-surface-hover"
          >
            <Sparkles className="size-4 text-[hsl(var(--accent))]" />
            Создать ролик
          </Link>
        </div>

        <nav className="px-3 pb-4">
          <div className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              const cls = cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-surface-elevated text-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                item.disabled && "opacity-50 pointer-events-none"
              );
              const inner = (
                <>
                  <Icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="muted" className="px-1.5 py-0 text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                </>
              );
              return item.disabled ? (
                <div key={item.href} className={cls}>
                  {inner}
                </div>
              ) : (
                <Link key={item.href} href={item.href} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          {user.name ?? user.email ?? "Аккаунт"}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
