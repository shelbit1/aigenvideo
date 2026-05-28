import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Вход",
};

export default function SignInPage() {
  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          С возвращением
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          Войдите, чтобы продолжить работу с AI-роликами.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card/80 p-6 sm:p-7 shadow-[0_24px_60px_-30px_hsl(0_0%_0%/_0.8)]">
        <AuthForm mode="signin" />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Продолжая, вы соглашаетесь с условиями использования.
      </p>
    </div>
  );
}
