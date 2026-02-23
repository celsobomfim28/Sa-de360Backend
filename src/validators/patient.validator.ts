import { z } from 'zod';
import { Sex } from '@prisma/client';

const addressSchema = z.object({
    street: z.string().min(1, 'Logradouro é obrigatório'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional().or(z.literal('')),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional().or(z.literal('')),
    referencePoint: z.string().optional().or(z.literal('')),
});

const eligibilityCriteriaSchema = z
    .object({
        isChild: z.boolean().default(false),
        isPregnant: z.boolean().default(false),
        lastMenstrualDate: z.string().datetime().optional(),
        isPostpartum: z.boolean().default(false),
        deliveryDate: z.string().datetime().optional(),
        hasHypertension: z.boolean().default(false),
        hypertensionDiagnosisDate: z.string().datetime().optional(),
        hasDiabetes: z.boolean().default(false),
        diabetesDiagnosisDate: z.string().datetime().optional(),
        isElderly: z.boolean().default(false),
        isWoman: z.boolean().default(false),
    })
    // Removida validação de pelo menos um critério - o backend calcula automaticamente
    // baseado na data de nascimento
    .refine(
        (data) => {
            // Se gestante, DUM é obrigatória
            if (data.isPregnant && !data.lastMenstrualDate) {
                return false;
            }
            return true;
        },
        {
            message: 'Data da última menstruação é obrigatória para gestantes',
            path: ['lastMenstrualDate'],
        }
    )
    .refine(
        (data) => {
            // Se puérpera, data do parto é obrigatória
            if (data.isPostpartum && !data.deliveryDate) {
                return false;
            }
            return true;
        },
        {
            message: 'Data do parto é obrigatória para puérperas',
            path: ['deliveryDate'],
        }
    );

export const createPatientSchema = z.object({
    cpf: z
        .string()
        .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
        .optional()
        .or(z.literal('')),
    cns: z.string().length(15, 'CNS deve ter 15 dígitos').optional().or(z.literal('')),
    fullName: z.string().min(3, 'Nome completo deve ter no mínimo 3 caracteres'),
    birthDate: z.string().datetime(),
    sex: z.nativeEnum(Sex),
    motherName: z.string().min(3, 'Nome da mãe deve ter no mínimo 3 caracteres').optional().or(z.literal('')),
    address: addressSchema,
    microAreaId: z.string().uuid('ID de microárea inválido'),
    primaryPhone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
    secondaryPhone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    eligibilityCriteria: eligibilityCriteriaSchema,
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
