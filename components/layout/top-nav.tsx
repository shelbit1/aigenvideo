import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

interface TopNavProps {
  title?: string;
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export function TopNav({ title, user }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-lg px-4 sm:px-6 lg:px-8">
      <MobileNav user={user} />

      <div className="flex flex-1 items-center gap-3">
        {title && (
          <h1 className="hidden md:block text-base font-medium text-foreground/90">
            {title}
          </h1>
        )}

        <div className="hidden lg:flex flex-1 max-w-md">
          <label className="group relative flex w-full items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Поиск проектов..."
              className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-12 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-border-strong focus:bg-surface-elevated transition-colors"
            />
            <kbd className="absolute right-2 hidden md:inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex">
          <Link href="/projects/new">
            <Sparkles className="size-4" />
            Новый ролик
          </Link>
        </Button>
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </div>
    </header>
  );
}
