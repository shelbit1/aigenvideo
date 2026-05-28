"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  SignInSchema,
  SignUpSchema,
  type AuthFormState,
} from "@/lib/auth/schemas";

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Проверьте корректность данных.",
      fieldErrors: parsed.error.flatten().fieldErrors as AuthFormState extends {
        fieldErrors?: infer F;
      }
        ? F
        : never,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        message:
          error.type === "CredentialsSignin"
            ? "Неверный email или пароль."
            : "Не удалось войти. Попробуйте ещё раз.",
      };
    }
    throw error;
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Проверьте корректность данных.",
      fieldErrors: parsed.error.flatten().fieldErrors as AuthFormState extends {
        fieldErrors?: infer F;
      }
        ? F
        : never,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    return {
      ok: false,
      message: "Пользователь с таким email уже существует.",
    };
  }

  const hashed = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      password: hashed,
      name: parsed.data.name ?? null,
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        message: "Аккаунт создан, но не удалось выполнить вход. Войдите вручную.",
      };
    }
    throw error;
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
