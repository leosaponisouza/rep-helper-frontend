// src/validation/authSchemas.ts
import { z } from 'zod';

// Regex para validação de email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mensagens de erro personalizadas
const errorMessages = {
  required: 'Este campo é obrigatório',
  email: {
    invalid: 'Por favor, insira um email válido',
    required: 'Email é obrigatório',
  },
  password: {
    min: 'A senha deve ter pelo menos 6 caracteres',
    max: 'A senha não pode ter mais de 50 caracteres',
    required: 'Senha é obrigatória',
  },
  name: {
    min: 'O nome deve ter pelo menos 2 caracteres',
    max: 'O nome não pode ter mais de 100 caracteres',
    required: 'Nome é obrigatório',
  },
  nickname: {
    min: 'O apelido deve ter pelo menos 2 caracteres',
    max: 'O apelido não pode ter mais de 30 caracteres',
    required: 'Apelido é obrigatório',
  },
  phone: {
    invalid: 'Por favor, insira um número de telefone válido',
    required: 'Telefone é obrigatório',
  },
  confirmPassword: {
    match: 'As senhas não coincidem',
    required: 'Confirmação de senha é obrigatória',
  },
};

// Esquema de validação para login
export const loginSchema = z.object({
  email: z
    .string({ required_error: errorMessages.email.required })
    .min(1, { message: errorMessages.email.required })
    .email({ message: errorMessages.email.invalid })
    .regex(EMAIL_REGEX, { message: errorMessages.email.invalid }),
  password: z
    .string({ required_error: errorMessages.password.required })
    .min(1, { message: errorMessages.password.required })
    .min(6, { message: errorMessages.password.min })
    .max(50, { message: errorMessages.password.max }),
});

// Esquema de validação para cadastro
export const signUpSchema = z
  .object({
    name: z
      .string({ required_error: errorMessages.name.required })
      .min(2, { message: errorMessages.name.min })
      .max(100, { message: errorMessages.name.max })
      .trim(),
    nickname: z
      .string()
      .min(2, { message: errorMessages.nickname.min })
      .max(30, { message: errorMessages.nickname.max })
      .trim()
      .optional(),
    phone: z
      .string()
      .optional(),
    email: z
      .string({ required_error: errorMessages.email.required })
      .min(1, { message: errorMessages.email.required })
      .email({ message: errorMessages.email.invalid })
      .regex(EMAIL_REGEX, { message: errorMessages.email.invalid }),
    password: z
      .string({ required_error: errorMessages.password.required })
      .min(6, { message: errorMessages.password.min })
      .max(50, { message: errorMessages.password.max }),
    confirmPassword: z
      .string({ required_error: errorMessages.confirmPassword.required })
      .min(1, { message: errorMessages.confirmPassword.required }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: errorMessages.confirmPassword.match,
    path: ['confirmPassword'],
  });

// Esquema de validação para recuperação de senha
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: errorMessages.email.required })
    .min(1, { message: errorMessages.email.required })
    .email({ message: errorMessages.email.invalid })
    .regex(EMAIL_REGEX, { message: errorMessages.email.invalid }),
});

// Tipos derivados dos esquemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
