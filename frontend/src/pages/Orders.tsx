import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, FileDown, FileSpreadsheet, MessageCircle, Search, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiDelete, apiGet } from "@/lib/api";
import type { Order, OrderItem, Product, RepeatOrderState } from "@/lib/types";
import { brl, formatDateTime, openWhatsApp, TYPE_LABELS, whatsappMessage } from "@/lib/format";
import { shareOrderPdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";

export default function Orders() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: () => apiGet<Order[]>("/orders") });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => apiGet<Product[]>("/products") });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [sharing, setSharing] = useState(false);

  // Copy an old order into the new-order form, using current catalog names/prices (deleted products are dropped).
  const repeatOrder = (o: Order) => {
    const catalog = new Map((productsQ.data ?? []).map((p) => [p.id, p]));
    const items: OrderItem[] = productsQ.data
      ? o.items.flatMap((i) => {
          const p = catalog.get(i.product_id);
          return p ? [{ ...i, name: p.name, sku: p.sku, price: p.price }] : [];
        })
      : o.items;
    if (items.length < o.items.length) toast.info("Alguns itens não existem mais no catálogo e foram removidos");
    const state: RepeatOrderState = {
      repeat: {
        customer_name: o.customer_name,
        customer_type: o.customer_type,
        items,
        payment_method: o.payment_method,
        payment_term: o.payment_term,
      },
    };
    navigate("/", { state });
    toast.success(`Pedido nº ${o.number} copiado — confira e salve`);
  };

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = ordersQ.isError ? [] : (ordersQ.data ?? []);
    return all.filter((o) => !q || o.customer_name.toLowerCase().includes(q) || String(o.number).includes(q));
  }, [ordersQ.data, ordersQ.isError, search]);

  const del = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/orders/${id}`),
    onSuccess: () => {
      toast.success("Pedido excluído");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["next-number"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: () => toast.error("Não foi possível excluir"),
  });

  const sendPdf = async (o: Order) => {
    setSharing(true);
    try {
      const r = await shareOrderPdf(o);
      if (r === "downloaded") toast.success("PDF baixado — anexe no WhatsApp");
      if (r === "shared") toast.success("PDF compartilhado");
    } catch {
      toast.error("Falha ao gerar o PDF");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]">Histórico</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="page-title-history">Pedidos</h1>
        </div>
        <a
          href="/api/orders/export"
          download
          className={cn(buttonVariants(), "h-11 rounded-xl bg-[#1E7E34] px-5 hover:bg-[#1E7E34]/90")}
          data-testid="btn-export-excel"
        >
          <FileSpreadsheet /> Exportar para Excel
        </a>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente ou nº do pedido"
          className="h-11 bg-card pl-9"
          data-testid="input-history-search"
        />
      </div>

      {ordersQ.isLoading && <p className="text-muted-foreground" data-testid="history-loading">Carregando…</p>}
      {ordersQ.isError && <p className="text-destructive" data-testid="history-error">Não foi possível carregar os pedidos.</p>}
      {!ordersQ.isLoading && !ordersQ.isError && list.length === 0 && (
        <div className="rounded-3xl border border-dashed p-10 text-center text-muted-foreground" data-testid="history-empty">
          Nenhum pedido encontrado.
        </div>
      )}

      <ul className="grid gap-3 md:grid-cols-2" data-testid="history-list">
        {list.map((o, idx) => (
          <li key={o.id} style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }} className="animate-rise">
            <button
              type="button"
              onClick={() => setSelected(o)}
              className="flex w-full items-center gap-4 rounded-2xl border border-[#F0E4D8] bg-card p-4 text-left shadow-[0_8px_24px_-18px_rgba(61,35,20,0.4)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-caramel/40 hover:shadow-lg"
              data-testid={`card-order-${o.id}`}
            >
              <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-cocoa text-[#FDF8F3]">
                <span className="text-[9px] uppercase tracking-widest text-[#D6C4B8]">Nº</span>
                <span className="font-mono text-lg font-bold leading-none">{o.number}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{o.customer_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(o.created_at)} · {o.items.reduce((s, i) => s + i.quantity, 0)} un.
                </p>
                <Badge
                  className={cn(
                    "mt-1.5",
                    o.customer_type === "revenda" ? "bg-[#EDE3DA] text-[#4A2B19]" : "bg-[#E8F0EC] text-[#1C4E33]",
                  )}
                >
                  {TYPE_LABELS[o.customer_type]}
                </Badge>
              </div>
              <span className="font-mono font-bold tabular-nums text-caramel">{brl(o.total)}</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg" data-testid="order-detail-dialog">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl" data-testid="order-detail-title">
                  Pedido Nº {selected.number}
                </DialogTitle>
                <DialogDescription>{formatDateTime(selected.created_at)}</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Cliente</dt>
                <dd className="font-semibold" data-testid="order-detail-customer">{selected.customer_name}</dd>
                <dt className="text-muted-foreground">Tipo</dt>
                <dd>{TYPE_LABELS[selected.customer_type]}</dd>
                <dt className="text-muted-foreground">Pagamento</dt>
                <dd>{selected.payment_method || "-"}</dd>
                <dt className="text-muted-foreground">Prazo</dt>
                <dd>{selected.payment_term || "-"}</dd>
                <dt className="text-muted-foreground">Entrega</dt>
                <dd>{selected.delivery || "-"}</dd>
                {selected.notes && (
                  <>
                    <dt className="text-muted-foreground">Obs.</dt>
                    <dd>{selected.notes}</dd>
                  </>
                )}
              </dl>
              <ul className="divide-y rounded-xl border text-sm" data-testid="order-detail-items">
                {selected.items.map((i) => (
                  <li key={i.product_id} className="flex justify-between gap-3 p-2.5">
                    <span>
                      <strong>{i.quantity}x {i.name}</strong>
                      {i.sku && <span className="ml-2 font-mono text-xs text-muted-foreground">{i.sku}</span>}
                    </span>
                    <span className="font-mono">{brl(i.price * i.quantity)}</span>
                  </li>
                ))}
                <li className="flex justify-between p-2.5 font-bold">
                  <span>Total</span>
                  <span className="font-mono text-caramel" data-testid="order-detail-total">{brl(selected.total)}</span>
                </li>
              </ul>
              <div className="grid gap-2">
                <Button
                  className="h-11 rounded-xl bg-whats font-semibold text-[#0D3B1E] hover:bg-whats/90"
                  disabled={sharing}
                  onClick={() => sendPdf(selected)}
                  data-testid={`btn-send-pdf-${selected.id}`}
                >
                  <FileDown /> Enviar PDF pelo WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => openWhatsApp(whatsappMessage(selected))}
                  data-testid={`btn-resend-whatsapp-${selected.id}`}
                >
                  <MessageCircle /> Reenviar texto no WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-caramel/40 text-caramel hover:text-caramel"
                  onClick={() => repeatOrder(selected)}
                  data-testid={`btn-repeat-order-${selected.id}`}
                >
                  <Copy /> Repetir pedido
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={del.isPending}
                  onClick={() => {
                    if (window.confirm(`Excluir o pedido nº ${selected.number}?`)) del.mutate(selected.id);
                  }}
                  data-testid={`btn-delete-order-${selected.id}`}
                >
                  <Trash2 /> Excluir pedido
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
