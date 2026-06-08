import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Client = Database["public"]["Tables"]["clients"]["Row"];

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

export const clientService = {
  async getClients(barbershopId: string): Promise<ServiceResult<Client[]>> {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("name");
      if (error) throw error;
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error("[clientService.getClients]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async getClientById(id: string): Promise<ServiceResult<Client>> {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[clientService.getClientById]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async findByPhone(barbershopId: string, phone: string): Promise<ServiceResult<Client | null>> {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .eq("phone", phone)
        .maybeSingle();
      if (error) throw error;
      return { data: data ?? null, error: null };
    } catch (err) {
      console.error("[clientService.findByPhone]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async createClient(
    barbershopId: string,
    input: { name: string; phone: string; email?: string; notes?: string },
  ): Promise<ServiceResult<Client>> {
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({ barbershop_id: barbershopId, ...input })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[clientService.createClient]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async updateClient(
    id: string,
    updates: Database["public"]["Tables"]["clients"]["Update"],
  ): Promise<ServiceResult<Client>> {
    try {
      const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[clientService.updateClient]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async getInactiveClients(barbershopId: string, days = 30): Promise<ServiceResult<Client[]>> {
    try {
      const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);

      const [clientsRes, recentAppts] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .eq("barbershop_id", barbershopId)
          .or(`last_visit.is.null,last_visit.lte.${cutoff}`),
        supabase
          .from("appointments")
          .select("client_id")
          .eq("barbershop_id", barbershopId)
          .in("status", ["pending", "confirmed"])
          .gte("date", today),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      const activeClientIds = new Set((recentAppts.data ?? []).map((a) => a.client_id));
      const inactive = (clientsRes.data ?? []).filter((c) => !activeClientIds.has(c.id));
      return { data: inactive, error: null };
    } catch (err) {
      console.error("[clientService.getInactiveClients]", err);
      return { data: null, error: errMsg(err) };
    }
  },
};
