import { useMemo, useState } from "react";
import { Check, Minus, Plus, Search } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CustomerType, OrderItem, Product } from "@/lib/types";
import { brl, productsForType, TYPE_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  products: Product[];
  type: CustomerType;
  selected: OrderItem[];
  onDone: (items: OrderItem[]) => void;
}

/** Multi-select picker: stays open while choosing; only "Concluir" returns to the order. */
export default function ItemPicker({ open, onOpenChange, products, type, selected, onDone }: Props) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [prevOpen, setPrevOpen] = useState(false);

  // Re-sync local quantities each time the sheet opens.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQty(Object.fromEntries(selected.map((i) => [i.product_id, i.quantity])));
      setSearch("");
    }
  }

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productsForType(products, type).filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [products, type, search]);

  const set = (id: string, n: number) => setQty((s) => ({ ...s, [id]: Math.max(0, n) }));
  const chosen = products.filter((p) => (qty[p.id] ?? 0) > 0);
  const count = chosen.reduce((s, p) => s + qty[p.id], 0);
  const total = chosen.reduce((s, p) => s + qty[p.id] * p.price, 0);

  const done = () => {
    onDone(
      chosen.map((p) => ({ product_id: p.id, name: p.name, sku: p.sku, price: p.price, quantity: qty[p.id] })),
    );
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col gap-0 rounded-t-3xl p-0"
        data-testid="sheet-item-picker"
      >
        <SheetHeader className="border-b px-5 pt-5 pb-4">
          <SheetTitle className="font-heading text-xl">Selecionar itens</SheetTitle>
          <SheetDescription data-testid="item-picker-type">
            Mostrando itens de <strong>{TYPE_LABELS[type]}</strong>. Escolha todos e toque em Concluir.
          </SheetDescription>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou SKU"
              className="h-11 bg-[#FAF6F0] pl-9"
              data-testid="input-item-search"
            />
          </div>
        </SheetHeader>

        <ul className="flex-1 space-y-2 overflow-y-auto px-5 py-4" data-testid="item-picker-list">
          {list.length === 0 && (
            <li className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground" data-testid="item-picker-empty">
              Nenhum produto de {TYPE_LABELS[type]} cadastrado.
            </li>
          )}
          {list.map((p) => {
            const n = qty[p.id] ?? 0;
            return (
              <li
                key={p.id}
                data-testid={`picker-item-${p.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-[border-color,background-color,box-shadow] duration-200",
                  n > 0 && "border-caramel/60 bg-[#FFF7EE] shadow-sm",
                )}
              >
                <button
                  type="button"
                  onClick={() => set(p.id, n + 1)}
                  className="min-w-0 flex-1 text-left"
                  data-testid={`btn-item-select-${p.id}`}
                >
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.sku && <span className="mr-2 font-mono">{p.sku}</span>}
                    <span className="font-mono font-semibold text-caramel">{brl(p.price)}</span>
                  </p>
                </button>
                {n === 0 ? (
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => set(p.id, 1)}
                    data-testid={`btn-item-inc-${p.id}`}
                    aria-label={`Adicionar ${p.name}`}
                  >
                    <Plus />
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 animate-pop">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => set(p.id, n - 1)}
                      data-testid={`btn-item-dec-${p.id}`}
                      aria-label="Diminuir"
                    >
                      <Minus />
                    </Button>
                    <Input
                      inputMode="numeric"
                      value={String(n)}
                      onChange={(e) => set(p.id, parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
                      className="h-8 w-12 text-center font-mono font-bold"
                      data-testid={`input-item-qty-${p.id}`}
                    />
                    <Button
                      size="icon-sm"
                      className="rounded-full"
                      onClick={() => set(p.id, n + 1)}
                      data-testid={`btn-item-inc-${p.id}`}
                      aria-label="Aumentar"
                    >
                      <Plus />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="border-t bg-card px-5 py-4">
          <Button
            className="h-12 w-full rounded-xl text-base font-semibold"
            onClick={done}
            data-testid="btn-item-picker-done"
          >
            <Check />
            Concluir seleção ({count} {count === 1 ? "item" : "itens"}) · <span className="font-mono">{brl(total)}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
