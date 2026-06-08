import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Professional = Database["public"]["Tables"]["professionals"]["Row"];

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

export const professionalService = {
  async getProfessionals(barbershopId: string): Promise<ServiceResult<Professional[]>> {
    try {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("name");
      if (error) throw error;
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error("[professionalService.getProfessionals]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async createProfessional(
    barbershopId: string,
    input: { name: string; phone?: string },
  ): Promise<ServiceResult<Professional>> {
    try {
      const { data, error } = await supabase
        .from("professionals")
        .insert({ barbershop_id: barbershopId, name: input.name, phone: input.phone ?? null })
        .select()
        .single();
      if (error) throw error;

      // Vincular todos os serviços ativos automaticamente
      const { data: services } = await supabase
        .from("services")
        .select("id")
        .eq("barbershop_id", barbershopId)
        .eq("active", true);
      if (services && services.length > 0) {
        await supabase.from("professional_services").insert(
          services.map((s) => ({
            professional_id: data.id,
            service_id: s.id,
            barbershop_id: barbershopId,
          })),
        );
      }

      return { data, error: null };
    } catch (err) {
      console.error("[professionalService.createProfessional]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async updateProfessional(
    id: string,
    updates: Database["public"]["Tables"]["professionals"]["Update"],
  ): Promise<ServiceResult<Professional>> {
    try {
      const { data, error } = await supabase
        .from("professionals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[professionalService.updateProfessional]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async toggleActive(id: string, active: boolean): Promise<ServiceResult<Professional>> {
    return professionalService.updateProfessional(id, { active });
  },

  async getProfessionalServices(professionalId: string): Promise<ServiceResult<string[]>> {
    try {
      const { data, error } = await supabase
        .from("professional_services")
        .select("service_id")
        .eq("professional_id", professionalId);
      if (error) throw error;
      return { data: (data ?? []).map((r) => r.service_id), error: null };
    } catch (err) {
      console.error("[professionalService.getProfessionalServices]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async updateProfessionalServices(
    barbershopId: string,
    professionalId: string,
    serviceIds: string[],
  ): Promise<ServiceResult<null>> {
    try {
      await supabase
        .from("professional_services")
        .delete()
        .eq("professional_id", professionalId);
      if (serviceIds.length > 0) {
        const { error } = await supabase.from("professional_services").insert(
          serviceIds.map((sid) => ({
            professional_id: professionalId,
            service_id: sid,
            barbershop_id: barbershopId,
          })),
        );
        if (error) throw error;
      }
      return { data: null, error: null };
    } catch (err) {
      console.error("[professionalService.updateProfessionalServices]", err);
      return { data: null, error: errMsg(err) };
    }
  },
};
