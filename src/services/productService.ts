import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type StockMovement = Database["public"]["Tables"]["stock_movements"]["Row"];

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

export const productService = {
  async getProducts(barbershopId: string): Promise<ServiceResult<Product[]>> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("name");
      if (error) throw error;
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error("[productService.getProducts]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async getCriticalStockProducts(barbershopId: string): Promise<ServiceResult<Product[]>> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .filter("stock_quantity", "lte", supabase.rpc as unknown as string)
        .order("name");

      // Fallback: fetch all and filter in JS since Supabase JS doesn't support column comparison directly
      if (error) throw error;
      return { data: (data ?? []).filter((p) => p.stock_quantity <= p.min_stock_alert), error: null };
    } catch {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("barbershop_id", barbershopId)
          .order("stock_quantity");
        if (error) throw error;
        const critical = (data ?? []).filter((p) => p.stock_quantity <= p.min_stock_alert);
        return { data: critical, error: null };
      } catch (err2) {
        console.error("[productService.getCriticalStockProducts]", err2);
        return { data: null, error: errMsg(err2) };
      }
    }
  },

  async createProduct(
    barbershopId: string,
    input: {
      name: string;
      category?: string | null;
      stock_quantity: number;
      min_stock_alert: number;
      unit_price?: number | null;
      cost_price?: number | null;
    },
  ): Promise<ServiceResult<Product>> {
    try {
      const { data, error } = await supabase
        .from("products")
        .insert({ barbershop_id: barbershopId, ...input })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[productService.createProduct]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async updateProduct(
    id: string,
    updates: Database["public"]["Tables"]["products"]["Update"],
  ): Promise<ServiceResult<Product>> {
    try {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("[productService.updateProduct]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async createMovement(
    barbershopId: string,
    input: {
      product_id: string;
      type: "entry" | "exit" | "adjustment";
      quantity: number;
      reason?: string | null;
    },
  ): Promise<ServiceResult<StockMovement>> {
    try {
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", input.product_id)
        .single();
      if (prodErr) throw prodErr;

      const delta =
        input.type === "entry"
          ? input.quantity
          : input.type === "exit"
            ? -input.quantity
            : input.quantity;
      const newQty = (product.stock_quantity ?? 0) + delta;
      if (newQty < 0) throw new Error("Estoque insuficiente");

      const [movResult] = await Promise.all([
        supabase
          .from("stock_movements")
          .insert({ barbershop_id: barbershopId, ...input })
          .select()
          .single(),
        supabase.from("products").update({ stock_quantity: newQty }).eq("id", input.product_id),
      ]);

      if (movResult.error) throw movResult.error;
      return { data: movResult.data, error: null };
    } catch (err) {
      console.error("[productService.createMovement]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async getMovements(barbershopId: string, productId?: string): Promise<ServiceResult<StockMovement[]>> {
    try {
      let q = supabase
        .from("stock_movements")
        .select("*, products(name)")
        .eq("barbershop_id", barbershopId)
        .order("created_at", { ascending: false });
      if (productId) q = (q as typeof q).eq("product_id", productId);
      const { data, error } = await q;
      if (error) throw error;
      return { data: (data ?? []) as unknown as StockMovement[], error: null };
    } catch (err) {
      console.error("[productService.getMovements]", err);
      return { data: null, error: errMsg(err) };
    }
  },
};
