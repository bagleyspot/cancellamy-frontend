import { z } from 'zod';
import { it } from '@/i18n/it';

const v = it.validation;

export const emailSchema = z.string().trim().min(1, v.required).pipe(z.email(v.email));
export const passwordSchema = z.string().min(10, v.passwordMin);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, v.required),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.boolean().refine((value) => value, v.acceptTerms),
});
export type RegisterForm = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({ email: emailSchema });
export type ForgotForm = z.infer<typeof forgotSchema>;

export const resetSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((data) => data.password === data.confirm, { message: v.passwordMismatch, path: ['confirm'] });
export type ResetForm = z.infer<typeof resetSchema>;
