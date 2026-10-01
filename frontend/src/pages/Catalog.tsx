import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Product, ProductInput } from "@/lib/types";
import { brl, isRevenda } from "@/lib/format";
import { cn } from "@/lib/utils";

interface FormState {
  name: string;
  sku: string;
  price: string;
}
const EMPTY: FormState = { name: "", sku: "", price: "" };

export default function Catalog() {
  const qc = useQueryClient();
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => apiGet<Product[]>("/products") });
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, price: String(p.price).replace(".", ",") });
    setOpen(true);
  };

  const saveM = useMutation({
    mutationFn: (body: ProductInput) =>
      editing ? apiPut<Product>(`/products/${editing.id}`, body) : apiPost<Product>("/products", body),
    onSuccess: () => {
      toast.success(editing ? "Produto atualizado" : "Produto cadastrado");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Não foi possível salvar o produto"),
  });

  const delM = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/products/${id}`),
    onSuccess: () => {
      toast.success("Produto excluído");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Não foi possível excluir"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price.replace(/\./g, "").replace(",", "."));
    if (!form.name.trim()) return toast.error("Informe o nome do produto");
    if (Number.isNaN(price) || price < 0) return toast.error("Informe um valor válido");
    saveM.mutate({ name: form.name.trim(), sku: form.sku.trim(), price });
  };

  const products = productsQ.isError ? [] : (productsQ.data ?? []);

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]">Catálogo</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="page-title-products">Produtos</h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            Produtos com a palavra <strong>“Revenda”</strong> no nome aparecem apenas em pedidos de revenda; os demais, em Cliente Final.
          </p>
        </div>
        <Button className="h-11 rounded-xl px-5" onClick={openNew} data-testid="btn-add-product">
          <Plus /> Novo produto
        </Button>
      </div>

      {productsQ.isError && <p className="text-destructive" data-testid="products-error">Não foi possível carregar os produtos.</p>}
      {!productsQ.isLoading && !productsQ.isError && products.length === 0 && (
        <div className="rounded-3xl border border-dashed p-10 text-center text-muted-foreground" data-testid="products-empty">
          Nenhum produto cadastrado ainda.
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="products-list">
        {products.map((p) => {
          const rev = isRevenda(p);
          return (
            <li
              key={p.id}
              data-testid={`card-product-${p.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-[#F0E4D8] bg-card p-4 shadow-[0_8px_24px_-18px_rgba(61,35,20,0.4)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold leading-snug" data-testid={`product-name-${p.id}`}>{p.name}</p>
                <Button size="icon-sm" variant="ghost" onClick={() => openEdit(p)} data-testid={`btn-edit-product-${p.id}`} aria-label="Editar">
                  <Pencil />
                </Button>
              </div>
              <div className="mt-auto flex items-end justify-between gap-2">
                <div className="space-y-1">
                  <Badge className={cn(rev ? "bg-[#EDE3DA] text-[#4A2B19]" : "bg-[#E8F0EC] text-[#1C4E33]")}>
                    {rev ? "Revenda" : "Cliente Final"}
                  </Badge>
                  <p className="font-mono text-xs text-muted-foreground" data-testid={`product-sku-${p.id}`}>
                    SKU: {p.sku || "—"}
                  </p>
                </div>
                <p className="font-mono text-xl font-bold tabular-nums text-caramel" data-testid={`product-price-${p.id}`}>
                  {brl(p.price)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" data-testid="product-dialog">
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
              <DialogDescription>Nome, SKU e valor. Inclua “Revenda” no nome para itens de revenda.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="p-name">Nome</Label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-product-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-sku">SKU</Label>
                <Input id="p-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="font-mono" data-testid="input-product-sku" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price">Valor (R$)</Label>
                <Input id="p-price" inputMode="decimal" placeholder="0,00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="font-mono" data-testid="input-product-price" />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              {editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => window.confirm(`Excluir “${editing.name}”?`) && delM.mutate(editing.id)}
                  data-testid="btn-delete-product"
                >
                  <Trash2 /> Excluir
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={saveM.isPending} data-testid="btn-save-product">
                {editing ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
