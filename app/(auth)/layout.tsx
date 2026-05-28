import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate min-h-dvh bg-background overflow-hidden">
      <div className="absolute inset-0 -z-10 gradient-radial" aria-hidden />
      <div
        className="absolute inset-0 -z-10 opacity-[0.18]"
        aria-hidden
        style={{
          background:
            "radial-gradient(800px 400px at 20% 0%, hsl(36 100% 60% / 0.18), transparent 60%), radial-gradient(900px 500px at 100% 100%, hsl(220 100% 60% / 0.12), transparent 60%)",
        }}
      />

      <header className="flex items-center justify-between px-6 sm:px-10 py-6">
        <Logo href="/" size="md" />
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          На главную
        </Link>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col items-center justify-center px-6 pb-16">
        {children}
      </main>
    </div>
  );
}
