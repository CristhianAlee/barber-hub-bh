import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type FinancialEntry = Database["public"]["Tables"]["financial_entries"]["Row"];
export type FixedCost = Database["public"]["Tables"]["fixed_costs"]["Row"];

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  averageTicket: number;
  totalSales: number;
}

export interface DailyReport {
  date: string;
  income: number;
  expense: number;
  net: number;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

export const financialService = {
  async getEntries(
    barbershopId: string,
    from: string,
    to: string,
    type?: "income" | "expense",
  ): Promise<ServiceResult<FinancialEntry[]>> {
    try {
      let q = supabase
        .from("financial_entries")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (type) q = (q as typeof q).eq("type", type);
      const { data, error } = await q;
      if (error) throw error;
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error("[financialService.getEntries]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async createEntry(
    barbershopId: string,
    input: {
      type: "income" | "expense";
      category: string;
      description: string;
      amount: number;
      date: string;
      payment_method?: string | null;
      notes?: string | null;
    },
  ): Promise<ServiceResult<FinancialEntry>> {
    try {
      const { data, error } = await supabase
        .from("financial_entries")
        .insert({ barbershop_id: barbershopId, ...input })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[financialService.createEntry]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async updateEntry(
    id: string,
    updates: Database["public"]["Tables"]["financial_entries"]["Update"],
  ): Promise<ServiceResult<FinancialEntry>> {
    try {
      const { data, error } = await supabase
        .from("financial_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[financialService.updateEntry]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async deleteEntry(id: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase.from("financial_entries").delete().eq("id", id);
      if (error) throw error;
      return { data: null, error: null };
    } catch (err) {
      console.error("[financialService.deleteEntry]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async getMetrics(barbershopId: string, from: string, to: string): Promise<ServiceResult<FinancialMetrics>> {
    try {
      const { data, error } = await supabase
        .from("financial_entries")
        .select("type, amount, sale_id")
        .eq("barbershop_id", barbershopId)
        .gte("date", from)
        .lte("date", to);
      if (error) throw error;

      const entries = data ?? [];
      const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + (e.amount ?? 0), 0);
      const totalExpense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + (e.amount ?? 0), 0);
      const salesEntries = entries.filter((e) => e.type === "income" && e.sale_id);
      const totalSales = salesEntries.length;
      const averageTicket = totalSales > 0 ? totalIncome / totalSales : 0;

      return {
        data: { totalIncome, totalExpense, netProfit: totalIncome - totalExpense, averageTicket, totalSales },
        error: null,
      };
    } catch (err) {
      console.error("[financialService.getMetrics]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async getDailyReport(barbershopId: string, from: string, to: string): Promise<ServiceResult<DailyReport[]>> {
    try {
      const { data, error } = await supabase
        .from("financial_entries")
        .select("date, type, amount")
        .eq("barbershop_id", barbershopId)
        .gte("date", from)
        .lte("date", to)
        .order("date");
      if (error) throw error;

      const map = new Map<string, DailyReport>();
      for (const entry of data ?? []) {
        if (!map.has(entry.date)) map.set(entry.date, { date: entry.date, income: 0, expense: 0, net: 0 });
        const day = map.get(entry.date)!;
        if (entry.type === "income") day.income += entry.amount ?? 0;
        else day.expense += entry.amount ?? 0;
        day.net = day.income - day.expense;
      }

      return { data: Array.from(map.values()), error: null };
    } catch (err) {
      console.error("[financialService.getDailyReport]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async getFixedCosts(barbershopId: string): Promise<ServiceResult<FixedCost[]>> {
    try {
      const { data, error } = await supabase
        .from("fixed_costs")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("name");
      if (error) throw error;
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error("[financialService.getFixedCosts]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async createFixedCost(
    barbershopId: string,
    input: { name: string; amount: number; due_day?: number | null; category?: string | null },
  ): Promise<ServiceResult<FixedCost>> {
    try {
      const { data, error } = await supabase
        .from("fixed_costs")
        .insert({ barbershop_id: barbershopId, ...input })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[financialService.createFixedCost]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async updateFixedCost(
    id: string,
    updates: Database["public"]["Tables"]["fixed_costs"]["Update"],
  ): Promise<ServiceResult<FixedCost>> {
    try {
      const { data, error } = await supabase
        .from("fixed_costs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[financialService.updateFixedCost]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async deleteFixedCost(id: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase.from("fixed_costs").delete().eq("id", id);
      if (error) throw error;
      return { data: null, error: null };
    } catch (err) {
      console.error("[financialService.deleteFixedCost]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async applyFixedCostsForMonth(
    barbershopId: string,
    year: number,
    month: number,
  ): Promise<ServiceResult<{ applied: number }>> {
    try {
      const { data: costs, error: costsErr } = await supabase
        .from("fixed_costs")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .eq("active", true);
      if (costsErr) throw costsErr;

      const entries = (costs ?? []).map((cost) => {
        const day = cost.due_day ?? 1;
        const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return {
          barbershop_id: barbershopId,
          type: "expense" as const,
          category: cost.category ?? "Custo Fixo",
          description: cost.name,
          amount: cost.amount,
          date,
        };
      });

      if (entries.length > 0) {
        const { error } = await supabase.from("financial_entries").insert(entries);
        if (error) throw error;
      }

      return { data: { applied: entries.length }, error: null };
    } catch (err) {
      console.error("[financialService.applyFixedCostsForMonth]", err);
      return { data: null, error: errMsg(err) };
    }
  },
};
