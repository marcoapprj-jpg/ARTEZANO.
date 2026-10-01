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

/** "2026-10-15" → "15/10/2026" (no timezone math: it's a calendar date). */
export const formatDateBR = (ymd: string | null | undefined) => (ymd ? ymd.split("-").reverse().join("/") : "");

/** Delivery line combining date and free text. */
export const deliveryText = (o: Pick<OrderInput, "delivery_date" | "delivery">) =>
  [formatDateBR(o.delivery_date), o.delivery].filter(Boolean).join(" · ");

export const customerPath = (name: string) => `/clientes/${encodeURIComponent(name.trim())}`;

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
    `*Entrega:* ${deliveryText(o) || "-"}`,
  ];
  if (o.notes) lines.push(`*Observações:* ${o.notes}`);
  if ("paid" in o && o.paid) lines.push("", "✅ *PAGO*");
  else if ("paid" in o && o.paid_amount > 0)
    lines.push("", `*Pago:* ${brl(o.paid_amount)}`, `*Saldo a pagar:* ${brl(o.balance)}`);
  lines.push("", "_Artezano Pudim — feito com carinho_");
  return lines.join("\n");
}

export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/** Statement of a customer's open orders (balance after partial payments), items in bold. */
export function customerStatement(name: string, orders: Order[]): string {
  const total = orders.reduce((s, o) => s + o.balance, 0);
  const lines: string[] = [
    "🍮 *ARTEZANO PUDIM*",
    "*EXTRATO DE PEDIDOS EM ABERTO*",
    "",
    `*Cliente:* ${name}`,
    "",
  ];
  for (const o of [...orders].sort((a, b) => a.number - b.number)) {
    lines.push(`*Pedido Nº ${o.number}* — ${new Date(o.created_at).toLocaleDateString("pt-BR")} — *${brl(o.total)}*`);
    for (const i of o.items) lines.push(`  • *${i.quantity}x ${i.name}*`);
    if (o.payment_term) lines.push(`  _Prazo: ${o.payment_term}_`);
    if (o.paid_amount > 0) lines.push(`  _Pago: ${brl(o.paid_amount)} · Saldo: ${brl(o.balance)}_`);
    lines.push("");
  }
  lines.push(`*TOTAL EM ABERTO: ${brl(total)}*`, `(${orders.length} pedido(s))`, "", "_Artezano Pudim — feito com carinho_");
  return lines.join("\n");
}

/** Orders of a customer still with something to receive. */
export const openOrdersOf = (orders: Order[], name: string) => {
  const key = name.trim().toLowerCase();
  return orders.filter((o) => o.balance > 0 && o.customer_name.trim().toLowerCase() === key);
};

const normName = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ").trim();

/** Same rule as backend/lib/stock.py: longest packaging name contained in the product name. */
export function matchPackaging<T extends { name: string }>(productName: string, packagings: T[]): T | undefined {
  const pn = normName(productName);
  let best: T | undefined;
  for (const p of packagings) {
    const key = normName(p.name);
    if (key && pn.includes(key) && (!best || key.length > normName(best.name).length)) best = p;
  }
  return best;
}

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
