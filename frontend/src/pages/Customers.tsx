import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { brl, customerPath, formatDateTime, TYPE_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function Customers() {
  const q = useQuery({ queryKey: ["customers"], queryFn: () => apiGet<Customer[]>("/customers") });
  const [search, setSearch] = useState("");
  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.isError ? [] : (q.data ?? [])).filter((c) => !s || c.name.toLowerCase().includes(s));
  }, [q.data, q.isError, search]);

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]">Carteira</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="page-title-customers">Clientes</h1>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente" className="h-11 bg-card pl-9" data-testid="input-customers-search" />
      </div>

      {q.isError && <p className="text-destructive" data-testid="customers-error">Não foi possível carregar os clientes.</p>}
      {!q.isLoading && !q.isError && list.length === 0 && (
        <div className="rounded-3xl border border-dashed p-10 text-center text-muted-foreground" data-testid="customers-empty">
          Nenhum cliente encontrado. Os clientes aparecem aqui após o primeiro pedido.
        </div>
      )}

      <ul className="grid gap-3 md:grid-cols-2" data-testid="customers-list">
        {list.map((c, idx) => (
          <li key={c.name} className="animate-rise" style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }}>
            <Link
              to={customerPath(c.name)}
              className="flex items-center gap-4 rounded-2xl border border-[#F0E4D8] bg-card p-4 shadow-[0_8px_24px_-18px_rgba(61,35,20,0.4)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-caramel/40 hover:shadow-lg"
              data-testid={`card-customer-${idx}`}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#F3E4D4] font-heading text-lg font-bold text-caramel">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold break-words">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.orders_count} pedido(s) · último em {formatDateTime(c.last_order_at)}
                </p>
                <Badge className={cn("mt-1", c.customer_type === "revenda" ? "bg-[#EDE3DA] text-[#4A2B19]" : "bg-[#E8F0EC] text-[#1C4E33]")}>
                  {TYPE_LABELS[c.customer_type]}
                </Badge>
              </div>
              <div className="flex shrink-0 flex-col items-end text-right">
                <span className="font-mono text-sm font-bold text-espresso">{brl(c.total_bought)}</span>
                {c.outstanding > 0 ? (
                  <span className="font-mono text-xs font-semibold text-destructive" data-testid={`customer-outstanding-${idx}`}>deve {brl(c.outstanding)}</span>
                ) : (
                  <span className="text-xs font-semibold text-[#1E7E34]">em dia</span>
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
