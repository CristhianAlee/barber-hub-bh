import { z } from "zod";
import type { TranslationKey } from "@/i18n/pt";

type T = (key: TranslationKey) => string;

// Campos reutilizáveis
const phoneField = (t: T) =>
  z
    .string()
    .min(10, t("val_phone_min"))
    .max(20, t("val_phone_max"))
    .regex(/^\d+$/, t("val_phone_digits_only"));

const emailField = (t: T) =>
  z
    .string()
    .email(t("val_email_invalid"))
    .max(254, t("val_email_max"))
    .optional()
    .or(z.literal(""));

const nameField = (t: T) =>
  z
    .string()
    .trim()
    .min(2, t("val_name_min"))
    .max(100, t("val_name_max"));

const notesField = (t: T) =>
  z
    .string()
    .max(500, t("val_notes_max"))
    .optional()
    .or(z.literal(""));

// Schema do agendamento público (página /agendar/[slug])
export const createPublicBookingSchema = (t: T) =>
  z.object({
    name: nameField(t),
    phone: phoneField(t),
    email: emailField(t),
    notes: notesField(t),
  });

// Schema de novo agendamento interno (painel do barbeiro)
export const createAppointmentSchema = (t: T) =>
  z.object({
    client_name: nameField(t),
    client_phone: phoneField(t),
    notes: notesField(t),
    date: z.string().min(1, t("val_select_date")),
    time: z.string().min(1, t("val_select_time")),
    service_id: z.string().uuid(t("val_select_service")),
    professional_id: z.string().uuid(t("val_select_professional")),
  });

// Schema de cliente
export const createClientSchema = (t: T) =>
  z.object({
    name: nameField(t),
    phone: phoneField(t),
    email: emailField(t),
    notes: notesField(t),
  });

// Schema de serviço
export const createServiceSchema = (t: T) =>
  z.object({
    name: z.string().trim().min(2, t("val_name_min")).max(80, t("val_name_max")),
    duration_minutes: z
      .number()
      .int()
      .min(5, t("val_duration_min"))
      .max(480, t("val_duration_max")),
    price: z.number().min(0, t("val_price_negative")).max(10000, t("val_price_max")),
  });

// Schema de profissional
export const createProfessionalSchema = (t: T) =>
  z.object({
    name: nameField(t),
    phone: phoneField(t),
  });

// Schema de produto (estoque)
export const createProductSchema = (t: T) =>
  z.object({
    name: z.string().trim().min(2, t("val_name_min")).max(100, t("val_name_max")),
    price: z.number().min(0, t("val_price_negative")).max(100000, t("val_price_max")),
    cost: z.number().min(0).max(100000).optional(),
    stock_quantity: z.number().int().min(0, t("val_stock_negative")).max(99999),
    min_stock_alert: z.number().int().min(0).max(99999),
    category: z.string().max(50, t("val_category_max")).optional().or(z.literal("")),
  });

// Schema de lançamento financeiro
export const createFinancialEntrySchema = (t: T) =>
  z.object({
    description: z.string().max(200, t("val_description_max")).optional().or(z.literal("")),
    amount: z.number().positive(t("val_amount_positive")).max(1000000, t("val_amount_max")),
    category: z.string().min(1, t("val_select_category")).max(50),
    date: z.string().min(1, t("val_select_date")),
    payment_method: z.string().max(50).optional(),
  });

// Schema de custo fixo
export const createFixedCostSchema = (t: T) =>
  z.object({
    name: z.string().trim().min(2, t("val_name_min")).max(100, t("val_name_max")),
    amount: z.number().positive(t("val_amount_positive")).max(1000000, t("val_amount_max")),
    due_day: z.number().int().min(1, t("val_due_day_range")).max(31, t("val_due_day_range")),
  });

// Schema de configurações da barbearia
export const createBarbershopSettingsSchema = (t: T) =>
  z.object({
    name: z.string().trim().min(2, t("val_name_min")).max(100, t("val_name_max")),
    address: z.string().max(200, t("val_address_max")).optional().or(z.literal("")),
    phone: phoneField(t),
  });

// Schema de login
export const createLoginSchema = (t: T) =>
  z.object({
    email: z.string().email(t("val_email_invalid")).max(254, t("val_email_max")),
    password: z.string().min(6, t("val_password_min6")).max(128, t("val_password_max")),
  });

// Schema de cadastro
export const createSignupSchema = (t: T) =>
  z.object({
    name: nameField(t),
    email: z.string().email(t("val_email_invalid")).max(254, t("val_email_max")),
    password: z.string().min(8, t("val_password_min8")).max(128, t("val_password_max")),
    barbershop_name: z
      .string()
      .trim()
      .min(2, t("val_barbershop_name_min"))
      .max(100, t("val_name_max")),
    phone: phoneField(t),
  });

export type PublicBookingData = z.infer<ReturnType<typeof createPublicBookingSchema>>;
export type AppointmentData = z.infer<ReturnType<typeof createAppointmentSchema>>;
export type ClientData = z.infer<ReturnType<typeof createClientSchema>>;
export type ServiceData = z.infer<ReturnType<typeof createServiceSchema>>;
export type ProfessionalData = z.infer<ReturnType<typeof createProfessionalSchema>>;
export type ProductData = z.infer<ReturnType<typeof createProductSchema>>;
export type FinancialEntryData = z.infer<ReturnType<typeof createFinancialEntrySchema>>;
export type FixedCostData = z.infer<ReturnType<typeof createFixedCostSchema>>;
export type BarbershopSettingsData = z.infer<ReturnType<typeof createBarbershopSettingsSchema>>;
export type LoginData = z.infer<ReturnType<typeof createLoginSchema>>;
export type SignupData = z.infer<ReturnType<typeof createSignupSchema>>;
