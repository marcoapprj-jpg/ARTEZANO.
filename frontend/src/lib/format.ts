import type { CustomerType, Order, OrderInput, Product } from "@/lib/types";

const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const brl = (v: number) => brlFmt.format(v);

export const TYPE_LABELS: Record<CustomerType, string> = {
  revenda: "Revenda",
  cliente_final: "Cliente Final",
};

/** A product is "revenda" when its name contains the word "revenda". */
export const isRevenda = (p: Pick<Product, "name">) => /revenda/i.test(p.name);

export const productsForType = (products: Product[], type: CustomerType) =>
  products.filter((p) => (type === "revenda" ? isRevenda(p) : !isRevenda(p)));

export const orderTotal = (o: Pick<OrderInput, "items">) =>
  o.items.reduce((s, i) => s + i.price * i.quantity, 0);

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function whatsappMessage(o: OrderInput | Order): string {
  const lines: string[] = [
    "🍮 *ARTEZANO PUDIM*",
    `*PEDIDO Nº ${o.number}*`,
    "",
    `*Cliente:* ${o.customer_name}`,
    `*Tipo:* ${TYPE_LABELS[o.customer_type]}`,
    "",
    "*ITENS:*",
    ...o.items.map(
      (i) =>
        `• *${i.quantity}x ${i.name} — ${brl(i.price * i.quantity)}*`,
    ),
    "",
    `*TOTAL: ${brl(orderTotal(o))}*`,
    "",
    `*Forma de pagamento:* ${o.payment_method || "-"}`,
    `*Prazo para pagamento:* ${o.payment_term || "-"}`,
    `*Entrega:* ${o.delivery || "-"}`,
  ];
  if (o.notes) lines.push(`*Observações:* ${o.notes}`);
  lines.push("", "_Artezano Pudim — feito com carinho_");
  return lines.join("\n");
}

export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/** Open WhatsApp share (contact chosen in the app). */
export function openWhatsApp(text: string, preopened?: Window | null) {
  const url = whatsappUrl(text);
  if (preopened && !preopened.closed) {
    preopened.location.href = url;
    return;
  }
  const w = window.open(url, "_blank");
  if (!w) window.location.href = url;
}
