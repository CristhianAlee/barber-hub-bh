import { z } from "zod";

// Campos reutilizáveis
const phoneField = z
  .string()
  .min(10, "Telefone deve ter pelo menos 10 dígitos")
  .max(20, "Telefone muito longo")
  .regex(/^\d+$/, "Telefone deve conter apenas números");

const emailField = z
  .string()
  .email("E-mail inválido")
  .max(254, "E-mail muito longo")
  .optional()
  .or(z.literal(""));

const nameField = z
  .string()
  .trim()
  .min(2, "Nome deve ter pelo menos 2 caracteres")
  .max(100, "Nome muito longo");

const notesField = z
  .string()
  .max(500, "Observações devem ter no máximo 500 caracteres")
  .optional()
  .or(z.literal(""));

// Schema do agendamento público (página /agendar/[slug])
export const publicBookingSchema = z.object({
  name: nameField,
  phone: phoneField,
  email: emailField,
  notes: notesField,
});

// Schema de novo agendamento interno (painel do barbeiro)
export const appointmentSchema = z.object({
  client_name: nameField,
  client_phone: phoneField,
  notes: notesField,
  date: z.string().min(1, "Selecione uma data"),
  time: z.string().min(1, "Selecione um horário"),
  service_id: z.string().uuid("Selecione um serviço"),
  professional_id: z.string().uuid("Selecione um profissional"),
});

// Schema de cliente
export const clientSchema = z.object({
  name: nameField,
  phone: phoneField,
  email: emailField,
  notes: notesField,
});

// Schema de serviço
export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(80, "Nome muito longo"),
  duration_minutes: z
    .number()
    .int()
    .min(5, "Duração mínima: 5 minutos")
    .max(480, "Duração máxima: 8 horas"),
  price: z.number().min(0, "Preço não pode ser negativo").max(10000, "Preço muito alto"),
});

// Schema de profissional
export const professionalSchema = z.object({
  name: nameField,
  phone: phoneField,
});

// Schema de produto (estoque)
export const productSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  price: z.number().min(0, "Preço não pode ser negativo").max(100000, "Preço muito alto"),
  cost: z.number().min(0).max(100000).optional(),
  stock_quantity: z.number().int().min(0, "Estoque não pode ser negativo").max(99999),
  min_stock_alert: z.number().int().min(0).max(99999),
  category: z.string().max(50, "Categoria muito longa").optional().or(z.literal("")),
});

// Schema de lançamento financeiro
export const financialEntrySchema = z.object({
  description: z.string().max(200, "Descrição muito longa").optional().or(z.literal("")),
  amount: z.number().positive("Valor deve ser positivo").max(1000000, "Valor muito alto"),
  category: z.string().min(1, "Selecione uma categoria").max(50),
  date: z.string().min(1, "Selecione uma data"),
  payment_method: z.string().max(50).optional(),
});

// Schema de custo fixo
export const fixedCostSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  amount: z.number().positive("Valor deve ser positivo").max(1000000, "Valor muito alto"),
  due_day: z.number().int().min(1, "Dia deve ser entre 1 e 31").max(31, "Dia deve ser entre 1 e 31"),
});

// Schema de configurações da barbearia
export const barbershopSettingsSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  address: z.string().max(200, "Endereço muito longo").optional().or(z.literal("")),
  phone: phoneField,
});

// Schema de login
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido").max(254, "E-mail muito longo"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(128, "Senha muito longa"),
});

// Schema de cadastro
export const signupSchema = z.object({
  name: nameField,
  email: z.string().email("E-mail inválido").max(254, "E-mail muito longo"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").max(128, "Senha muito longa"),
  barbershop_name: z
    .string()
    .trim()
    .min(2, "Nome da barbearia deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  phone: phoneField,
});

export type PublicBookingData = z.infer<typeof publicBookingSchema>;
export type AppointmentData = z.infer<typeof appointmentSchema>;
export type ClientData = z.infer<typeof clientSchema>;
export type ServiceData = z.infer<typeof serviceSchema>;
export type ProfessionalData = z.infer<typeof professionalSchema>;
export type ProductData = z.infer<typeof productSchema>;
export type FinancialEntryData = z.infer<typeof financialEntrySchema>;
export type FixedCostData = z.infer<typeof fixedCostSchema>;
export type BarbershopSettingsData = z.infer<typeof barbershopSettingsSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
