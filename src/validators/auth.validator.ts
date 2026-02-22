import { z } from 'zod';

export const loginSchema = z.object({
    cpf: z
        .string()
        .min(11, 'CPF deve ter 11 dígitos')
        .max(14, 'CPF inválido')
        .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato de CPF inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
