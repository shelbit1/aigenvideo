"use client";

import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth/actions";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  const initials = (name ?? email ?? "?")
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-full p-0.5 pr-3 transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-ring/40">
        <Avatar className="size-8 ring-1 ring-border-strong">
          {image ? <AvatarImage src={image} alt={name ?? ""} /> : null}
          <AvatarFallback className="bg-surface-elevated text-foreground text-xs">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-left text-sm sm:block">
          <span className="block max-w-[10rem] truncate font-medium text-foreground">
            {name ?? "Аккаунт"}
          </span>
          {email && (
            <span className="block max-w-[10rem] truncate text-xs text-muted-foreground">
              {email}
            </span>
          )}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Аккаунт</DropdownMenuLabel>
        <div className="px-2 pb-2 text-xs text-muted-foreground">
          <div className="truncate">{name ?? "Без имени"}</div>
          <div className="truncate">{email ?? "—"}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserIcon className="size-4" /> Профиль
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings className="size-4" /> Настройки
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center gap-2 text-left"
            >
              <LogOut className="size-4" /> Выйти
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
