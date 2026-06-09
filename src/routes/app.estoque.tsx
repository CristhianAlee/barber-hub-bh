import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brl, formatDateBR } from "@/lib/format";
import { Plus, Search, Loader2, ArrowDown, ArrowUp, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/estoque")({
  component: EstoquePage,
});

type Product = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_alert: number;
  active: boolean;
};

function EstoquePage() {
  const { barbershop } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [openNew, setOpenNew] = useState(false);
  const [moveProduct, setMoveProduct] = useState<Product | null>(null);

  const load = async () => {
    if (!barbershop) return;
    setLoading(true);
    const { data: pData } = await supabase
      .from("products")
      .select("id, name, category, description, price, cost, stock_quantity, min_stock_alert, active")
      .eq("barbershop_id", barbershop.id)
      .eq("active", true)
      .order("name");
    const ids = (pData ?? []).map((p: any) => p.id);
    let mData: any[] = [];
    if (ids.length > 0) {
      const { data } = await supabase
        .from("stock_movements")
        .select("id, product_id, type, quantity, reason, created_at, products(name)")
        .in("product_id", ids)
        .order("created_at", { ascending: false })
        .limit(100);
      mData = data ?? [];
    }
    setProducts((pData as Product[]) ?? []);
    setMovements(mData);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [barbershop]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, category]);

  const lowStockCount = products.filter((p) => p.stock_quantity <= p.min_stock_alert).length;

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide md:text-4xl">{t("stock_title")}</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} produto{products.length !== 1 && "s"}
            {lowStockCount > 0 && (
              <span className="ml-2 text-destructive">• {lowStockCount} crítico{lowStockCount !== 1 && "s"}</span>
            )}
          </p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> {t("stock_new_product")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
            <ProductForm onDone={() => { setOpenNew(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">{t("stock_products")}</TabsTrigger>
          <TabsTrigger value="movimentacao">{t("stock_movements")}</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("stock_search")} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("stock_all_categories")}</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border bg-card p-2 md:p-4">
            {loading ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/30" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
                {t("stock_no_products")}
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((p) => {
                  const low = p.stock_quantity <= p.min_stock_alert;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setMoveProduct(p)}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-background/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{p.name}</span>
                          {low && (
                            <Badge className="animate-pulse border-destructive/40 bg-destructive/15 text-destructive font-normal">
                              {t("stock_critical")}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.category ?? "Sem categoria"} • Custo {brl(Number(p.cost))} • Venda {brl(Number(p.price))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-lg font-bold ${low ? "text-destructive" : ""}`}>
                          {p.stock_quantity}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t("stock_min")} {p.min_stock_alert}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="movimentacao">
          <Card className="border-border bg-card p-2 md:p-4">
            {loading ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />)}
              </div>
            ) : movements.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">{t("stock_no_movements")}</p>
            ) : (
              <div className="space-y-1">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg p-2.5 text-sm">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      m.type === "in" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    }`}>
                      {m.type === "in" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{m.products?.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {m.reason ?? (m.type === "in" ? t("stock_entry") : t("stock_exit"))} • {formatDateBR(m.created_at.slice(0, 10))}
                      </div>
                    </div>
                    <div className={`font-mono font-bold ${m.type === "in" ? "text-success" : "text-destructive"}`}>
                      {m.type === "in" ? "+" : "−"}{m.quantity}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!moveProduct} onOpenChange={(o) => !o && setMoveProduct(null)}>
        <DialogContent className="bg-card">
          {moveProduct && (
            <MovementForm product={moveProduct} onDone={() => { setMoveProduct(null); load(); }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({ onDone }: { onDone: () => void }) {
  const { barbershop } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("0");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [min, setMin] = useState("5");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!barbershop) return toast.error("Barbearia não encontrada. Recarregue a página.");
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      barbershop_id: barbershop.id,
      name,
      category: category || null,
      description: description || null,
      cost: Number(cost) || 0,
      price: Number(price) || 0,
      stock_quantity: Number(stock) || 0,
      min_stock_alert: Number(min) || 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Produto cadastrado");
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl tracking-wide">{t("stock_new_product_title")}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5"><Label>{t("stock_name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>{t("stock_category")}</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Pomada" /></div>
          <div className="space-y-1.5"><Label>{t("stock_initial_stock")}</Label><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label>{t("stock_cost")}</Label><Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>{t("stock_sale_price")}</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>{t("stock_min_alert")}</Label><Input type="number" value={min} onChange={(e) => setMin(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>{t("stock_description")}</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
        <Button onClick={submit} disabled={saving} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
        </Button>
      </div>
    </>
  );
}

function MovementForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const { t } = useLanguage();
  const [type, setType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const q = Number(quantity);
    if (!q || q < 1) return toast.error("Quantidade inválida");
    setSaving(true);
    const newStock = type === "in" ? product.stock_quantity + q : product.stock_quantity - q;
    if (newStock < 0) { setSaving(false); return toast.error("Estoque ficaria negativo"); }
    const { error: e1 } = await supabase.from("stock_movements").insert({ product_id: product.id, type, quantity: q, reason: reason || null });
    if (e1) { setSaving(false); return toast.error(e1.message); }
    const { error: e2 } = await supabase.from("products").update({ stock_quantity: newStock }).eq("id", product.id);
    setSaving(false);
    if (e2) return toast.error(e2.message);
    toast.success("Movimentação registrada");
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl tracking-wide">{product.name}</DialogTitle>
        <p className="text-sm text-muted-foreground">{t("stock_current_stock")}: <span className="font-mono text-gold">{product.stock_quantity}</span></p>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button variant={type === "in" ? "default" : "outline"} onClick={() => setType("in")} className={type === "in" ? "bg-success text-success-foreground" : ""}>
            <ArrowUp className="mr-1 h-4 w-4" /> {t("stock_entry")}
          </Button>
          <Button variant={type === "out" ? "default" : "outline"} onClick={() => setType("out")} className={type === "out" ? "bg-destructive text-destructive-foreground" : ""}>
            <ArrowDown className="mr-1 h-4 w-4" /> {t("stock_exit")}
          </Button>
        </div>
        <div className="space-y-1.5"><Label>{t("stock_quantity")}</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>{t("stock_reason")}</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={type === "in" ? "Compra, reposição..." : "Uso interno, descarte..."} /></div>
        <Button onClick={submit} disabled={saving} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirm")}
        </Button>
      </div>
    </>
  );
}
