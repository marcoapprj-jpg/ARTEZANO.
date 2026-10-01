import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { SalesReport } from "@/lib/types";
import { brl } from "@/lib/format";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const monthLabel = (ym: string) => `${MONTHS[parseInt(ym.slice(5, 7), 10) - 1]}/${ym.slice(2, 4)}`;
const monthLong = (ym: string) => {
  const s = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const shiftMonth = (ym: string, d: number) => {
  const dt = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + d, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};
const card = "rounded-3xl border border-[#F0E4D8] bg-card p-5 shadow-[0_10px_30px_-20px_rgba(61,35,20,0.35)]";

export default function Sales() {
  // undefined = let the server pick the current month (server-anchored "today").
  const [month, setMonth] = useState<string | undefined>(undefined);
  const q = useQuery({
    queryKey: ["sales", month ?? "current"],
    queryFn: () => apiGet<SalesReport>(`/reports/sales${month ? `?month=${month}` : ""}`),
  });
  const r = q.isError ? undefined : q.data;
  const current = month ?? r?.month;
  const maxQty = Math.max(1, ...(r?.top_products.map((p) => p.quantity) ?? [1]));

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]">Relatórios</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="page-title-sales">Vendas</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full border bg-card p-1">
          <Button size="icon-sm" variant="ghost" className="rounded-full" disabled={!current} onClick={() => current && setMonth(shiftMonth(current, -1))} data-testid="btn-sales-prev-month" aria-label="Mês anterior">
            <ChevronLeft />
          </Button>
          <span className="min-w-36 text-center text-sm font-semibold" data-testid="sales-month-label">
            {current ? monthLong(current) : "—"}
          </span>
          <Button size="icon-sm" variant="ghost" className="rounded-full" disabled={!current} onClick={() => current && setMonth(shiftMonth(current, 1))} data-testid="btn-sales-next-month" aria-label="Próximo mês">
            <ChevronRight />
          </Button>
        </div>
      </div>

      {q.isError && <p className="text-destructive" data-testid="sales-error">Não foi possível carregar o relatório.</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-cocoa p-5 text-[#FDF8F3] shadow-[0_24px_50px_-24px_rgba(44,24,16,0.8)] sm:col-span-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D6C4B8]">Total do mês</p>
          <p className="mt-1 font-mono text-4xl font-bold tabular-nums" data-testid="sales-month-total">{brl(r?.month_total ?? 0)}</p>
        </div>
        <div className={card}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]">Pedidos no mês</p>
          <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-caramel" data-testid="sales-month-orders">{r?.month_orders ?? 0}</p>
        </div>
      </div>

      <div className={card}>
        <h2 className="mb-4 text-lg font-bold">Vendas por dia</h2>
        <div className="h-56" data-testid="sales-daily-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r?.days ?? []} margin={{ left: -10, right: 4 }}>
              <CartesianGrid vertical={false} stroke="#F0E4D8" />
              <XAxis dataKey="period" tickFormatter={(v: string) => String(Number(v.slice(8)))} tick={{ fontSize: 11, fill: "#6E5A4E" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "#6E5A4E" }} width={50} />
              <Tooltip
                formatter={(value: number) => [brl(value), "Total"]}
                labelFormatter={(label: string) => label.split("-").reverse().join("/")}
                cursor={{ fill: "#FFF7EE" }}
              />
              <Bar dataKey="total" fill="#B85D19" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h2 className="mb-4 text-lg font-bold">Vendas por mês</h2>
          <div className="h-56" data-testid="sales-monthly-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r?.months ?? []} margin={{ left: -10, right: 4 }}>
                <CartesianGrid vertical={false} stroke="#F0E4D8" />
                <XAxis dataKey="period" tickFormatter={monthLabel} tick={{ fontSize: 11, fill: "#6E5A4E" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6E5A4E" }} width={50} />
                <Tooltip formatter={(value: number) => [brl(value), "Total"]} labelFormatter={(label: string) => monthLabel(label)} cursor={{ fill: "#FFF7EE" }} />
                <Bar dataKey="total" fill="#3D2314" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={card}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Trophy className="size-5 text-honey" /> Mais vendidos no mês
          </h2>
          {(r?.top_products.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground" data-testid="sales-top-empty">Nenhuma venda neste mês.</p>
          ) : (
            <ol className="space-y-3" data-testid="sales-top-products">
              {r?.top_products.map((p, idx) => (
                <li key={p.name} data-testid={`sales-top-product-${idx}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-semibold">
                      <span className="mr-2 font-mono text-caramel">{idx + 1}.</span>
                      {p.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {p.quantity} un · {brl(p.total)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F3E9DF]">
                    <div className="h-full rounded-full bg-caramel transition-[width] duration-500" style={{ width: `${(p.quantity / maxQty) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
