import { z } from "zod";

export const SignInSchema = z.object({
  email: z.email({ error: "Введите корректный email" }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "Пароль должен быть не короче 8 символов" }),
});

export const SignUpSchema = SignInSchema.extend({
  name: z
    .string()
    .min(2, { error: "Имя должно быть не короче 2 символов" })
    .max(48, { error: "Имя слишком длинное" })
    .trim()
    .optional(),
  password: z
    .string()
    .min(8, { error: "Пароль должен быть не короче 8 символов" })
    .max(72, { error: "Пароль не должен превышать 72 символа" }),
});

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;

export type AuthFormState =
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<"email" | "password" | "name", string[]>>;
    }
  | {
      ok: true;
      redirectTo?: string;
    }
  | undefined;
