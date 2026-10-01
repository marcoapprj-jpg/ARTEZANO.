import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, CheckCircle2 } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Agenda as AgendaData, Order } from "@/lib/types";
import { formatDateBR } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const weekday = (ymd: string) => WEEKDAYS[new Date(`${ymd}T12:00:00`).getDay()];

function dayTitle(ymd: string, today: string) {
  const diff = Math.round((new Date(`${ymd}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return weekday(ymd);
}

/** Total units per product to prepare. */
function prepList(orders: Order[]) {
  const m = new Map<string, number>();
  for (const o of orders) for (const i of o.items) m.set(i.name, (m.get(i.name) ?? 0) + i.quantity);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function OrderRow({ o }: { o: Order }) {
  return (
    <li>
      <Link
        to={`/pedidos?pedido=${o.id}`}
        className="flex gap-3 rounded-xl border border-[#F0E4D8] bg-card p-3 transition-[border-color,box-shadow] duration-200 hover:border-caramel/40 hover:shadow-md"
        data-testid={`agenda-order-${o.id}`}
      >
        <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-cocoa text-[#FDF8F3]">
          <span className="text-[8px] uppercase tracking-widest text-[#D6C4B8]">Nº</span>
          <span className="font-mono text-sm font-bold leading-none">{o.number}</span>
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <p className="flex items-center gap-1.5 font-semibold">
            <span className="break-words">{o.customer_name}</span>
            {o.paid && <CheckCircle2 className="size-4 shrink-0 text-[#1E7E34]" aria-label="Quitado" />}
          </p>
          {o.delivery && <p className="text-xs text-caramel">{o.delivery}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {o.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ")}
          </p>
        </div>
      </Link>
    </li>
  );
}

export default function Agenda() {
  const q = useQuery({ queryKey: ["agenda"], queryFn: () => apiGet<AgendaData>("/agenda?days=7") });
  const a = q.isError ? undefined : q.data;
  const weekOrders = useMemo(() => (a?.days ?? []).flatMap((d) => d.orders), [a]);
  const weekPrep = useMemo(() => prepList(weekOrders), [weekOrders]);

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]">Produção</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="page-title-agenda">Agenda de entregas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hoje e os próximos 6 dias. Pedidos aparecem aqui quando têm <strong>data de entrega</strong>.
          {a && a.undated > 0 && <span data-testid="agenda-undated"> ({a.undated} pedido(s) sem data)</span>}
        </p>
      </div>

      {q.isLoading && <p className="text-muted-foreground">Carregando…</p>}
      {q.isError && <p className="text-destructive" data-testid="agenda-error">Não foi possível carregar a agenda.</p>}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {a && a.overdue.length > 0 && (
            <section className="rounded-3xl border border-[#F0B4B4] bg-[#FFF3F3] p-4" data-testid="agenda-overdue">
              <h2 className="mb-3 flex items-center gap-2 font-bold text-destructive">
                <AlertTriangle className="size-5" /> Atrasados / dias anteriores ({a.overdue.length})
              </h2>
              <ul className="space-y-2">
                {a.overdue.map((o) => (
                  <div key={o.id}>
                    <p className="mb-1 text-xs font-semibold text-destructive">{formatDateBR(o.delivery_date)}</p>
                    <OrderRow o={o} />
                  </div>
                ))}
              </ul>
            </section>
          )}

          {a?.days.map((d) => {
            const isToday = d.date === a.today;
            const prep = prepList(d.orders);
            return (
              <section
                key={d.date}
                className={cn(
                  "rounded-3xl border p-4 shadow-[0_10px_30px_-22px_rgba(61,35,20,0.35)]",
                  isToday ? "border-caramel/50 bg-[#FFF7EE]" : "border-[#F0E4D8] bg-card",
                )}
                data-testid={`agenda-day-${d.date}`}
              >
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <h2 className={cn("font-heading text-lg font-bold", isToday && "text-caramel")}>
                    {dayTitle(d.date, a.today)} <span className="text-sm font-medium text-muted-foreground">{formatDateBR(d.date)}</span>
                  </h2>
                  <span className="text-xs font-semibold text-muted-foreground" data-testid={`agenda-day-count-${d.date}`}>
                    {d.orders.length} pedido(s)
                  </span>
                </div>
                {d.orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma entrega.</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {d.orders.map((o) => (
                        <OrderRow key={o.id} o={o} />
                      ))}
                    </ul>
                    <p className="mt-3 rounded-xl bg-[#F3E9DF] px-3 py-2 text-xs text-[#4A2B19]" data-testid={`agenda-day-prep-${d.date}`}>
                      <strong>Preparar:</strong> {prep.map(([n, q]) => `${q}x ${n}`).join(" · ")}
                    </p>
                  </>
                )}
              </section>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-cocoa p-5 text-[#FDF8F3] shadow-[0_24px_50px_-24px_rgba(44,24,16,0.8)]" data-testid="agenda-week-prep">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D6C4B8]">
              <CalendarDays className="size-4" /> Produção da semana
            </p>
            <p className="mt-1 font-mono text-3xl font-bold">{weekOrders.length} <span className="text-sm font-normal text-[#D6C4B8]">pedido(s)</span></p>
            {weekPrep.length === 0 ? (
              <p className="mt-3 text-sm text-[#D6C4B8]">Nada agendado.</p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm">
                {weekPrep.map(([n, qty]) => (
                  <li key={n} className="flex justify-between gap-3">
                    <span className="break-words">{n}</span>
                    <span className="shrink-0 font-mono font-bold text-honey">{qty}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
