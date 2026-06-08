import { supabase, supabasePublic } from "@/lib/supabase";
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

  /** Uso público (link de agendamento) — usa supabasePublic */
  async getPublicBarbershop(slug: string): Promise<ServiceResult<{
    barbershop: Record<string, unknown>;
    services: Record<string, unknown>[];
    professionals: Record<string, unknown>[];
    hours: Record<string, unknown>[];
    professionalHours: Record<string, unknown>[];
    professionalServices: Record<string, unknown>[];
  }>> {
    try {
      const { data: bs, error: bsErr } = await supabasePublic
        .from("barbershops")
        .select("id, name, slug, phone, address, logo_url, booking_interval_minutes, max_advance_days")
        .eq("slug", slug)
        .maybeSingle();
      if (bsErr) throw bsErr;
      if (!bs) throw new Error("Barbearia não encontrada");

      const [svcRes, profRes, hoursRes, profHoursRes, psRes] = await Promise.all([
        supabasePublic.from("services").select("id, name, price, duration_minutes").eq("barbershop_id", bs.id).eq("active", true).order("name"),
        supabasePublic.from("professionals").select("id, name, avatar_url").eq("barbershop_id", bs.id).eq("active", true).order("name"),
        supabasePublic.from("business_hours").select("day_of_week, open_time, close_time, is_closed").eq("barbershop_id", bs.id),
        supabasePublic.from("professional_business_hours").select("professional_id, day_of_week, open_time, close_time, is_closed").eq("barbershop_id", bs.id),
        supabasePublic.from("professional_services").select("professional_id, service_id").eq("barbershop_id", bs.id),
      ]);

      return {
        data: {
          barbershop: bs as Record<string, unknown>,
          services: (svcRes.data ?? []) as Record<string, unknown>[],
          professionals: (profRes.data ?? []) as Record<string, unknown>[],
          hours: (hoursRes.data ?? []) as Record<string, unknown>[],
          professionalHours: (profHoursRes.data ?? []) as Record<string, unknown>[],
          professionalServices: (psRes.data ?? []) as Record<string, unknown>[],
        },
        error: null,
      };
    } catch (err) {
      console.error("[appointmentService.getPublicBarbershop]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async getPublicBusySlots(
    barbershopId: string,
    professionalId: string,
    date: string,
  ): Promise<ServiceResult<{ time: string; duration_minutes: number }[]>> {
    try {
      const { data, error } = await supabasePublic
        .from("appointments")
        .select("time, duration_minutes")
        .eq("barbershop_id", barbershopId)
        .eq("professional_id", professionalId)
        .eq("date", date)
        .neq("status", "cancelled");
      if (error) throw error;
      return { data: (data ?? []) as { time: string; duration_minutes: number }[], error: null };
    } catch (err) {
      console.error("[appointmentService.getPublicBusySlots]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async createPublicAppointment(input: {
    barbershop_id: string;
    professional_id: string;
    service_id: string;
    date: string;
    time: string;
    duration_minutes: number;
    name: string;
    phone: string;
    email?: string;
    notes?: string;
  }): Promise<ServiceResult<Appointment>> {
    try {
      // Find or create client
      const { data: existing } = await supabasePublic
        .from("clients")
        .select("id")
        .eq("barbershop_id", input.barbershop_id)
        .eq("phone", input.phone)
        .maybeSingle();

      let clientId: string;
      if (existing) {
        clientId = existing.id;
      } else {
        const { data: newClient, error: cErr } = await supabasePublic
          .from("clients")
          .insert({ barbershop_id: input.barbershop_id, name: input.name, phone: input.phone, email: input.email ?? null })
          .select("id")
          .single();
        if (cErr) throw cErr;
        clientId = newClient.id;
      }

      // Conflict check
      const { data: clash } = await supabasePublic
        .from("appointments")
        .select("id")
        .eq("barbershop_id", input.barbershop_id)
        .eq("professional_id", input.professional_id)
        .eq("date", input.date)
        .eq("time", input.time)
        .neq("status", "cancelled")
        .maybeSingle();
      if (clash) throw new Error("Horário já ocupado, escolha outro");

      const { data, error } = await supabasePublic
        .from("appointments")
        .insert({
          barbershop_id: input.barbershop_id,
          professional_id: input.professional_id,
          client_id: clientId,
          service_id: input.service_id,
          date: input.date,
          time: input.time,
          duration_minutes: input.duration_minutes,
          status: "pending",
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[appointmentService.createPublicAppointment]", err);
      return { data: null, error: errMsg(err) };
    }
  },
};
