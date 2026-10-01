import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Boxes, CalendarDays, ClipboardList, History, Menu, Package, Users } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { to: "/", label: "Pedido", icon: ClipboardList, id: "nav-new-order", end: true },
  { to: "/pedidos", label: "Histórico", icon: History, id: "nav-history", end: true },
  { to: "/agenda", label: "Agenda", icon: CalendarDays, id: "nav-agenda", end: true },
  { to: "/clientes", label: "Clientes", icon: Users, id: "nav-customers", end: false },
];
const MORE = [
  { to: "/vendas", label: "Vendas", icon: BarChart3, id: "nav-sales", end: true },
  { to: "/estoque", label: "Estoque", icon: Boxes, id: "nav-stock", end: true },
  { to: "/produtos", label: "Produtos", icon: Package, id: "nav-products", end: true },
];
const ALL = [...PRIMARY, ...MORE];

export default function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const moreActive = MORE.some((m) => pathname.startsWith(m.to));

  return (
    <div className="min-h-dvh bg-background pb-24 lg:pb-10">
      <header className="sticky top-0 z-30 bg-cocoa/95 text-[#FDF8F3] backdrop-blur-md shadow-[0_6px_24px_-12px_rgba(44,24,16,0.6)]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:px-8">
          <img src="/logo.jpg" alt="Artezano Pudim" className="size-11 rounded-full ring-2 ring-honey/70" data-testid="header-logo" />
          <div className="leading-tight">
            <p className="font-heading text-lg font-bold tracking-tight" data-testid="header-brand">Artezano Pudim</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#D6C4B8]">Lançador de pedidos</p>
          </div>
          <nav className="ml-auto hidden gap-1 lg:flex">
            {ALL.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                data-testid={`${n.id}-desktop`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200",
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

      <nav className="fixed inset-x-3 bottom-3 z-30 mx-auto grid max-w-xl grid-cols-5 gap-1 rounded-2xl border border-white/10 bg-cocoa/95 p-1.5 shadow-2xl backdrop-blur-md lg:hidden">
        {PRIMARY.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
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
        <DropdownMenu>
          <DropdownMenuTrigger
            data-testid="nav-more"
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors duration-200",
              moreActive ? "bg-caramel text-white" : "text-[#D6C4B8]",
            )}
          >
            <Menu className="size-5" />
            Mais
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={10} className="min-w-44">
            {MORE.map((m) => (
              <DropdownMenuItem key={m.to} onClick={() => navigate(m.to)} data-testid={m.id} className="gap-2 py-2.5">
                <m.icon className="size-4 text-caramel" />
                {m.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <Toaster richColors position="bottom-right" offset={{ bottom: 96 }} mobileOffset={{ bottom: 96 }} />
    </div>
  );
}
