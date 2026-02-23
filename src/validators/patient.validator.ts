import { z } from 'zod';
import { Sex } from '@prisma/client';

const optionalMaskedDigits = (min: number, max = min, message = 'Valor inválido') =>
    z.preprocess(
        (value) => {
            if (value === '' || value === null || value === undefined) return undefined;
            if (typeof value !== 'string') return value;
            const digits = value.replace(/\D/g, '');
            return digits === '' ? undefined : digits;
        },
        z
            .string()
            .refine((v) => v.length >= min && v.length <= max, message)
            .optional()
    );

const optionalDateTime = z.preprocess(
    (value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        return value;
    },
    z.string().datetime().optional()
);

const addressSchema = z.object({
    street: z.string().min(1, 'Logradouro é obrigatório'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional().or(z.literal('')),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    zipCode: optionalMaskedDigits(8, 8, 'CEP inválido'),
    referencePoint: z.string().optional().or(z.literal('')),
});

const eligibilityCriteriaSchema = z
    .object({
        isChild: z.boolean().default(false),
        isPregnant: z.boolean().default(false),
        lastMenstrualDate: optionalDateTime,
        isPostpartum: z.boolean().default(false),
        deliveryDate: optionalDateTime,
        hasHypertension: z.boolean().default(false),
        hypertensionDiagnosisDate: optionalDateTime,
        hasDiabetes: z.boolean().default(false),
        diabetesDiagnosisDate: optionalDateTime,
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
    cpf: optionalMaskedDigits(11, 11, 'CPF inválido'),
    cns: optionalMaskedDigits(15, 15, 'CNS deve ter 15 dígitos'),
    fullName: z.string().min(3, 'Nome completo deve ter no mínimo 3 caracteres'),
    birthDate: z.string().datetime(),
    sex: z.nativeEnum(Sex),
    motherName: z.string().min(3, 'Nome da mãe deve ter no mínimo 3 caracteres').optional().or(z.literal('')),
    address: addressSchema,
    microAreaId: z.string().uuid('ID de microárea inválido'),
    primaryPhone: optionalMaskedDigits(10, 11, 'Telefone inválido'),
    secondaryPhone: optionalMaskedDigits(10, 11, 'Telefone inválido'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    eligibilityCriteria: eligibilityCriteriaSchema,
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
