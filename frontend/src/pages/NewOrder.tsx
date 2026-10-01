import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ListPlus, Minus, Plus, Save, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ItemPicker from "@/components/ItemPicker";
import ChipGroup from "@/components/ChipGroup";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import type { CustomerType, NextNumber, Order, OrderInput, OrderItem, Product } from "@/lib/types";
import { brl, openWhatsApp, orderTotal, TYPE_LABELS, whatsappMessage } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAYMENTS = ["Pix", "Dinheiro", "Cartão", "Boleto"];
const TERMS = ["À vista", "7 dias", "14 dias", "28 dias"];

const fieldLabel = "text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]";

export default function NewOrder() {
  const qc = useQueryClient();
  const nextQ = useQuery({ queryKey: ["next-number"], queryFn: () => apiGet<NextNumber>("/orders/next-number") });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => apiGet<Product[]>("/products") });

  const [numberText, setNumberText] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomerType>("cliente_final");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payment, setPayment] = useState("");
  const [term, setTerm] = useState("");
  const [delivery, setDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const suggested = nextQ.isError ? "" : String(nextQ.data?.next_number ?? "");
  const numberValue = numberText !== "" ? numberText : suggested;
  const total = orderTotal({ items });

  const reset = () => {
    setNumberText("");
    setName("");
    setItems([]);
    setPayment("");
    setTerm("");
    setDelivery("");
    setNotes("");
  };

  const save = useMutation({
    mutationFn: (body: OrderInput) => apiPost<Order>("/orders", body),
  });

  const submit = async (sendWhats: boolean) => {
    const number = parseInt(numberValue, 10);
    if (!number || number < 1) return toast.error("Informe o número do pedido");
    if (!name.trim()) return toast.error("Informe o nome do cliente");
    if (items.length === 0) return toast.error("Selecione ao menos um item");
    const body: OrderInput = {
      number,
      customer_name: name.trim(),
      customer_type: type,
      items,
      payment_method: payment,
      payment_term: term,
      delivery,
      notes,
    };
    // Open the tab inside the click so mobile browsers don't block the popup.
    const pre = sendWhats ? window.open("", "_blank") : null;
    try {
      const order = await save.mutateAsync(body);
      if (sendWhats) openWhatsApp(whatsappMessage(order), pre);
      toast.success(`Pedido nº ${order.number} salvo!`);
      reset();
      qc.invalidateQueries({ queryKey: ["next-number"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (e) {
      pre?.close();
      const detail = e instanceof ApiError ? (e.body as { detail?: unknown } | null)?.detail : null;
      toast.error(typeof detail === "string" ? detail : "Não foi possível salvar o pedido");
      if (e instanceof ApiError && e.status === 409) {
        setNumberText("");
        qc.invalidateQueries({ queryKey: ["next-number"] });
      }
    }
  };

  const changeType = (t: CustomerType) => {
    if (t === type) return;
    if (items.length) toast.info("Itens limpos ao trocar o tipo de cliente");
    setType(t);
    setItems([]);
  };

  const changeQty = (id: string, delta: number) =>
    setItems((list) =>
      list.flatMap((i) => (i.product_id !== id ? [i] : i.quantity + delta <= 0 ? [] : [{ ...i, quantity: i.quantity + delta }])),
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] animate-rise">
      <section className="space-y-6">
        <div>
          <p className={fieldLabel}>Lançamento</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="page-title-new-order">
            Novo pedido
          </h1>
        </div>

        <div className="grid gap-4 rounded-3xl border border-[#F0E4D8] bg-card p-5 shadow-[0_10px_30px_-20px_rgba(61,35,20,0.35)] sm:grid-cols-[160px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="num" className={fieldLabel}>Pedido Nº</Label>
            <Input
              id="num"
              inputMode="numeric"
              value={numberValue}
              onChange={(e) => setNumberText(e.target.value.replace(/\D/g, ""))}
              className="h-12 bg-[#FAF6F0] font-mono text-xl font-bold text-caramel"
              data-testid="input-order-number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className={fieldLabel}>Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
              className="h-12 bg-[#FAF6F0] text-base"
              data-testid="input-customer-name"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-[#F0E4D8] bg-card p-5 shadow-[0_10px_30px_-20px_rgba(61,35,20,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={fieldLabel}>Itens</p>
            <div className="grid grid-cols-2 rounded-full bg-[#F3E9DF] p-1" role="tablist">
              {(["cliente_final", "revenda"] as CustomerType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => changeType(t)}
                  data-testid={t === "revenda" ? "toggle-type-revenda" : "toggle-type-cliente-final"}
                  data-active={type === t}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-semibold transition-[background-color,color] duration-200",
                    type === t ? "bg-cocoa text-white shadow" : "text-[#6B4934]",
                  )}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#E2D3C4] bg-[#FAF6F0] p-8 text-[#6E5A4E] transition-colors duration-200 hover:border-caramel/60"
              data-testid="btn-open-item-picker-empty"
            >
              <ListPlus className="size-7 text-caramel" />
              <span className="font-medium">Toque para escolher os itens de {TYPE_LABELS[type]}</span>
            </button>
          ) : (
            <ul className="divide-y rounded-2xl border" data-testid="selected-items-list">
              {items.map((i) => (
                <li key={i.product_id} className="flex items-center gap-3 p-3" data-testid={`selected-item-${i.product_id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.sku && <span className="mr-2 font-mono">{i.sku}</span>}
                      <span className="font-mono">{brl(i.price)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon-xs" variant="outline" className="rounded-full" onClick={() => changeQty(i.product_id, -1)} data-testid={`btn-selected-dec-${i.product_id}`} aria-label="Diminuir">
                      {i.quantity === 1 ? <Trash2 /> : <Minus />}
                    </Button>
                    <span className="w-7 text-center font-mono font-bold" data-testid={`selected-qty-${i.product_id}`}>{i.quantity}</span>
                    <Button size="icon-xs" variant="outline" className="rounded-full" onClick={() => changeQty(i.product_id, 1)} data-testid={`btn-selected-inc-${i.product_id}`} aria-label="Aumentar">
                      <Plus />
                    </Button>
                  </div>
                  <span className="w-24 text-right font-mono font-bold tabular-nums">{brl(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" className="w-full rounded-xl" onClick={() => setPickerOpen(true)} data-testid="btn-open-item-picker">
            <ListPlus /> {items.length ? "Adicionar / alterar itens" : "Selecionar itens"}
          </Button>
          {productsQ.isError && (
            <p className="text-sm text-destructive" data-testid="products-error">Não foi possível carregar os produtos.</p>
          )}
        </div>

        <div className="grid gap-5 rounded-3xl border border-[#F0E4D8] bg-card p-5 shadow-[0_10px_30px_-20px_rgba(61,35,20,0.35)]">
          <div className="space-y-2">
            <p className={fieldLabel}>Forma de pagamento</p>
            <ChipGroup options={PAYMENTS} value={payment} onChange={setPayment} testPrefix="chip-payment" />
            <Input value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="Ou digite outra forma" className="bg-[#FAF6F0]" data-testid="input-payment-method" />
          </div>
          <div className="space-y-2">
            <p className={fieldLabel}>Prazo para pagamento</p>
            <ChipGroup options={TERMS} value={term} onChange={setTerm} testPrefix="chip-term" />
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Ou digite outro prazo" className="bg-[#FAF6F0]" data-testid="input-payment-term" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery" className={fieldLabel}>Entrega</Label>
            <Input id="delivery" value={delivery} onChange={(e) => setDelivery(e.target.value)} placeholder="Ex.: 15/03 às 14h, retirada na loja" className="bg-[#FAF6F0]" data-testid="input-delivery-date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className={fieldLabel}>Observações</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="bg-[#FAF6F0]" data-testid="input-notes" />
          </div>
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-4 rounded-3xl bg-cocoa p-5 text-[#FDF8F3] shadow-[0_24px_50px_-24px_rgba(44,24,16,0.8)]">
          <div className="flex items-baseline justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-[#D6C4B8]">Resumo</p>
            <p className="font-mono text-sm text-honey" data-testid="summary-order-number">Nº {numberValue || "—"}</p>
          </div>
          <div className="space-y-1 text-sm text-[#D6C4B8]">
            <p data-testid="summary-customer">{name || "Cliente"} · {TYPE_LABELS[type]}</p>
            <p data-testid="summary-count">{items.reduce((s, i) => s + i.quantity, 0)} unidade(s)</p>
          </div>
          <p className="font-mono text-4xl font-bold tabular-nums" data-testid="summary-total">{brl(total)}</p>
          <Button
            className="h-12 w-full rounded-xl bg-whats text-base font-semibold text-[#0D3B1E] hover:bg-whats/90"
            disabled={save.isPending}
            onClick={() => submit(true)}
            data-testid="btn-submit-order-whatsapp"
          >
            <Send /> Salvar e enviar no WhatsApp
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full rounded-xl border-white/20 bg-transparent text-[#FDF8F3] hover:bg-white/10 hover:text-white"
            disabled={save.isPending}
            onClick={() => submit(false)}
            data-testid="btn-submit-order-save"
          >
            <Save /> Apenas salvar
          </Button>
        </div>
      </aside>

      <ItemPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        products={productsQ.data ?? []}
        type={type}
        selected={items}
        onDone={setItems}
      />
    </div>
  );
}
