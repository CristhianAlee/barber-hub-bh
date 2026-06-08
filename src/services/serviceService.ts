import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Service = Database["public"]["Tables"]["services"]["Row"];

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

export const serviceService = {
  async getServices(barbershopId: string, onlyActive = false): Promise<ServiceResult<Service[]>> {
    try {
      let q = supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("name");
      if (onlyActive) q = (q as typeof q).eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error("[serviceService.getServices]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async createService(
    barbershopId: string,
    input: { name: string; duration_minutes: number; price: number },
  ): Promise<ServiceResult<Service>> {
    try {
      const { data, error } = await supabase
        .from("services")
        .insert({ barbershop_id: barbershopId, ...input })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[serviceService.createService]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async updateService(
    id: string,
    updates: Database["public"]["Tables"]["services"]["Update"],
  ): Promise<ServiceResult<Service>> {
    try {
      const { data, error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[serviceService.updateService]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async toggleActive(id: string, active: boolean): Promise<ServiceResult<Service>> {
    return serviceService.updateService(id, { active });
  },
};
