import { supabase } from "@/lib/supabase";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

export interface SaleItem {
  product_id: string | null;
  service_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CompleteSaleInput {
  barbershop_id: string;
  professional_id: string;
  client_id: string;
  appointment_id: string | null;
  items: SaleItem[];
  payment_method: string;
  notes?: string | null;
}

export const checkoutService = {
  async completeSale(input: CompleteSaleInput): Promise<ServiceResult<{ saleId: string }>> {
    try {
      const totalAmount = input.items.reduce((sum, i) => sum + i.total_price, 0);

      // 1. Create sale
      const { data: sale, error: saleErr } = await supabase
        .from("sales")
        .insert({
          barbershop_id: input.barbershop_id,
          professional_id: input.professional_id,
          client_id: input.client_id,
          appointment_id: input.appointment_id,
          total_amount: totalAmount,
          payment_method: input.payment_method,
          notes: input.notes ?? null,
        })
        .select("id")
        .single();
      if (saleErr) throw saleErr;

      // 2. Create sale items
      const { error: itemsErr } = await supabase.from("sale_items").insert(
        input.items.map((item) => ({
          sale_id: sale.id,
          product_id: item.product_id,
          service_id: item.service_id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
      );
      if (itemsErr) throw itemsErr;

      // 3. Stock movements for products
      const productItems = input.items.filter((i) => i.product_id);
      if (productItems.length > 0) {
        const stockOps = productItems.map(async (item) => {
          const { data: prod } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.product_id!)
            .single();

          if (!prod) return;

          const newQty = (prod.stock_quantity ?? 0) - item.quantity;
          await supabase
            .from("products")
            .update({ stock_quantity: newQty })
            .eq("id", item.product_id!);

          await supabase.from("stock_movements").insert({
            barbershop_id: input.barbershop_id,
            product_id: item.product_id!,
            type: "exit",
            quantity: item.quantity,
            reason: "Venda",
            sale_id: sale.id,
          });
        });
        await Promise.all(stockOps);
      }

      // 4. Financial entry
      const { error: finErr } = await supabase.from("financial_entries").insert({
        barbershop_id: input.barbershop_id,
        type: "income",
        category: "Serviço/Venda",
        description: `Venda #${sale.id.slice(0, 8)}`,
        amount: totalAmount,
        date: new Date().toISOString().slice(0, 10),
        payment_method: input.payment_method,
        sale_id: sale.id,
      });
      if (finErr) throw finErr;

      // 5. Update appointment status to completed
      if (input.appointment_id) {
        await supabase
          .from("appointments")
          .update({ status: "completed" })
          .eq("id", input.appointment_id);
      }

      // 6. Update client stats
      const today = new Date().toISOString().slice(0, 10);
      const { data: clientData } = await supabase
        .from("clients")
        .select("total_visits, total_spent")
        .eq("id", input.client_id)
        .single();

      if (clientData) {
        await supabase
          .from("clients")
          .update({
            total_visits: (clientData.total_visits ?? 0) + 1,
            total_spent: (clientData.total_spent ?? 0) + totalAmount,
            last_visit: today,
          })
          .eq("id", input.client_id);
      }

      return { data: { saleId: sale.id }, error: null };
    } catch (err) {
      console.error("[checkoutService.completeSale]", err);
      return { data: null, error: errMsg(err) };
    }
  },
};
