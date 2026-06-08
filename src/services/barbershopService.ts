import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Barbershop = Database["public"]["Tables"]["barbershops"]["Row"];

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

export const barbershopService = {
  async getBarbershop(): Promise<ServiceResult<Barbershop>> {
    try {
      const { data, error } = await supabase
        .from("barbershops")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[barbershopService.getBarbershop]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async updateBarbershop(
    id: string,
    updates: Database["public"]["Tables"]["barbershops"]["Update"],
  ): Promise<ServiceResult<Barbershop>> {
    try {
      const { data, error } = await supabase
        .from("barbershops")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[barbershopService.updateBarbershop]", err);
      return { data: null, error: errMsg(err) };
    }
  },
};
