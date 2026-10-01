import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ClipboardPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { Order, RepeatOrderState } from "@/lib/types";
import { brl, customerStatement, formatDateBR, formatDateTime, openOrdersOf, openWhatsApp, TYPE_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

const card = "rounded-3xl border border-[#F0E4D8] bg-card p-5 shadow-[0_10px_30px_-20px_rgba(61,35,20,0.35)]";

export default function CustomerDetail() {
  const { name: raw = "" } = useParams();
  const name = decodeURIComponent(raw);
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["orders"], queryFn: () => apiGet<Order[]>("/orders") });

  const orders = useMemo(() => {
    const key = name.trim().toLowerCase();
    return (q.isError ? [] : (q.data ?? [])).filter((o) => o.customer_name.trim().toLowerCase() === key);
  }, [q.data, q.isError, name]);
  const open = openOrdersOf(orders, name);
  const totalBought = orders.reduce((s, o) => s + o.total, 0);
  const outstanding = open.reduce((s, o) => s + o.balance, 0);
  const received = orders.reduce((s, o) => s + (o.paid ? o.total : o.paid_amount), 0);
  const displayName = orders[0]?.customer_name ?? name;
  const type = orders[0]?.customer_type;

  const newOrder = () => {
    const state: RepeatOrderState = {
      repeat: { customer_name: displayName, customer_type: type ?? "cliente_final", items: [], payment_method: "", payment_term: "" },
    };
    navigate("/", { state });
  };

  return (
    <div className="space-y-6 animate-rise">
      <Link to="/clientes" className="inline-flex items-center gap-1 text-sm font-medium text-caramel hover:underline" data-testid="link-back-customers">
        <ArrowLeft className="size-4" /> Clientes
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]">{type ? TYPE_LABELS[type] : "Cliente"}</p>
          <h1 className="text-3xl font-bold tracking-tight break-words md:text-4xl" data-testid="customer-detail-name">{displayName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" onClick={newOrder} data-testid="btn-customer-new-order">
            <ClipboardPlus /> Novo pedido
          </Button>
          <Button
            className="rounded-xl bg-whats text-[#0D3B1E] hover:bg-whats/90"
            disabled={open.length === 0}
            onClick={() => (open.length ? openWhatsApp(customerStatement(displayName, open)) : toast.info("Nada em aberto"))}
            data-testid="btn-customer-statement"
          >
            <MessageCircle /> Enviar extrato
          </Button>
        </div>
      </div>

      {q.isError && <p className="text-destructive" data-testid="customer-error">Não foi possível carregar os pedidos.</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-cocoa p-5 text-[#FDF8F3] shadow-[0_24px_50px_-24px_rgba(44,24,16,0.8)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D6C4B8]">Total comprado</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums" data-testid="customer-total-bought">{brl(totalBought)}</p>
          <p className="text-xs text-[#D6C4B8]">{orders.length} pedido(s)</p>
        </div>
        <div className={card}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]">Recebido</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-[#1E7E34]" data-testid="customer-received">{brl(received)}</p>
        </div>
        <div className={card}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]">Em aberto</p>
          <p className={cn("mt-1 font-mono text-3xl font-bold tabular-nums", outstanding > 0 ? "text-destructive" : "text-[#1E7E34]")} data-testid="customer-outstanding">
            {brl(outstanding)}
          </p>
          <p className="text-xs text-muted-foreground">{open.length} pedido(s) pendente(s)</p>
        </div>
      </div>

      <div className={card}>
        <h2 className="mb-4 text-lg font-bold">Histórico de pedidos</h2>
        {!q.isLoading && orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground" data-testid="customer-orders-empty">Nenhum pedido encontrado.</p>
        ) : (
          <ul className="divide-y" data-testid="customer-orders">
            {orders.map((o) => (
              <li key={o.id}>
                <Link to={`/pedidos?pedido=${o.id}`} className="flex items-center gap-3 py-3 transition-colors duration-150 hover:bg-[#FFF7EE]" data-testid={`customer-order-${o.id}`}>
                  <span className="w-14 shrink-0 font-mono font-bold text-caramel">Nº {o.number}</span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(o.created_at)}
                      {o.delivery_date && ` · entrega ${formatDateBR(o.delivery_date)}`}
                    </p>
                    <p className="truncate">{o.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ")}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="font-mono text-sm font-bold">{brl(o.total)}</span>
                    {o.paid ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#1E7E34]"><CheckCircle2 className="size-3" /> quitado</span>
                    ) : (
                      <span className="font-mono text-[11px] text-destructive">saldo {brl(o.balance)}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
