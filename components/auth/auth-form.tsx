"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signInAction,
  signUpAction,
} from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/schemas";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "signin" ? signInAction : signUpAction;

  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    undefined
  );

  const errors =
    state && !state.ok ? state.fieldErrors ?? {} : ({} as Record<string, string[]>);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {mode === "signup" && (
        <Field
          label="Имя"
          name="name"
          autoComplete="name"
          placeholder="Как вас зовут"
          error={errors.name?.[0]}
        />
      )}

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.[0]}
        required
      />

      <Field
        label="Пароль"
        name="password"
        type="password"
        autoComplete={mode === "signin" ? "current-password" : "new-password"}
        placeholder="Минимум 8 символов"
        error={errors.password?.[0]}
        required
      />

      {state && !state.ok && state.message && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-[hsl(var(--destructive))]">
          {state.message}
        </div>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-1">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {mode === "signin" ? "Входим..." : "Создаём аккаунт..."}
          </>
        ) : mode === "signin" ? (
          "Войти"
        ) : (
          "Создать аккаунт"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>
            Нет аккаунта?{" "}
            <Link
              href="/signup"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Создать
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link
              href="/signin"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Войти
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {error && (
        <span className="text-xs text-[hsl(var(--destructive))]">{error}</span>
      )}
    </div>
  );
}
