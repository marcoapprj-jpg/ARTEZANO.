import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, ClipboardList, History, Package } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Novo pedido", icon: ClipboardList, id: "nav-new-order" },
  { to: "/pedidos", label: "Histórico", icon: History, id: "nav-history" },
  { to: "/vendas", label: "Vendas", icon: BarChart3, id: "nav-sales" },
  { to: "/produtos", label: "Produtos", icon: Package, id: "nav-products" },
];

export default function AppShell() {
  return (
    <div className="min-h-dvh bg-background pb-24 md:pb-10">
      <header className="sticky top-0 z-30 bg-cocoa/95 text-[#FDF8F3] backdrop-blur-md shadow-[0_6px_24px_-12px_rgba(44,24,16,0.6)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 md:px-8">
          <img
            src="/logo.jpg"
            alt="Artezano Pudim"
            className="size-11 rounded-full ring-2 ring-honey/70"
            data-testid="header-logo"
          />
          <div className="leading-tight">
            <p className="font-heading text-lg font-bold tracking-tight" data-testid="header-brand">
              Artezano Pudim
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#D6C4B8]">Lançador de pedidos</p>
          </div>
          <nav className="ml-auto hidden gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end
                data-testid={`${n.id}-desktop`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                    isActive ? "bg-caramel text-white" : "text-[#D6C4B8] hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <n.icon className="size-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 md:px-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-cocoa/95 p-1.5 shadow-2xl backdrop-blur-md md:hidden" style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end
            data-testid={n.id}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors duration-200",
                isActive ? "bg-caramel text-white" : "text-[#D6C4B8]",
              )
            }
          >
            <n.icon className="size-5" />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <Toaster richColors position="bottom-right" offset={{ bottom: 96 }} mobileOffset={{ bottom: 96 }} />
    </div>
  );
}
