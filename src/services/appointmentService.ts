import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

export const appointmentService = {
  async getByDate(barbershopId: string, date: string): Promise<ServiceResult<Appointment[]>> {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, time, date, status, notes, duration_minutes, professional_id, client_id, service_id, clients(name, phone), services(name, price, duration_minutes), professionals(name)",
        )
        .eq("barbershop_id", barbershopId)
        .eq("date", date)
        .order("time");
      if (error) throw error;
      return { data: (data ?? []) as unknown as Appointment[], error: null };
    } catch (err) {
      console.error("[appointmentService.getByDate]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async updateStatus(
    id: string,
    status: Appointment["status"],
  ): Promise<ServiceResult<Appointment>> {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[appointmentService.updateStatus]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async reschedule(
    id: string,
    date: string,
    time: string,
    professionalId: string,
    barbershopId: string,
  ): Promise<ServiceResult<Appointment>> {
    try {
      const { data: clash } = await supabase
        .from("appointments")
        .select("id")
        .eq("barbershop_id", barbershopId)
        .eq("professional_id", professionalId)
        .eq("date", date)
        .eq("time", time)
        .neq("status", "cancelled")
        .neq("id", id)
        .maybeSingle();
      if (clash) throw new Error("Horário já ocupado, escolha outro");

      const { data, error } = await supabase
        .from("appointments")
        .update({ date, time, status: "confirmed" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[appointmentService.reschedule]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async create(
    barbershopId: string,
    input: {
      professional_id: string;
      client_id: string;
      service_id: string;
      date: string;
      time: string;
      duration_minutes: number;
      notes?: string | null;
    },
  ): Promise<ServiceResult<Appointment>> {
    try {
      const { data: clash } = await supabase
        .from("appointments")
        .select("id")
        .eq("barbershop_id", barbershopId)
        .eq("professional_id", input.professional_id)
        .eq("date", input.date)
        .eq("time", input.time)
        .neq("status", "cancelled")
        .maybeSingle();
      if (clash) throw new Error("Horário já ocupado, escolha outro");

      const { data, error } = await supabase
        .from("appointments")
        .insert({ barbershop_id: barbershopId, ...input, status: "confirmed" })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[appointmentService.create]", err);
      return { data: null, error: errMsg(err) };
    }
  },
};
