import { Routes, Route } from "react-router-dom";
import AppShell from "@/components/AppShell";
import NewOrder from "@/pages/NewOrder";
import Orders from "@/pages/Orders";
import Catalog from "@/pages/Catalog";
import Sales from "@/pages/Sales";
import Stock from "@/pages/Stock";
import Agenda from "@/pages/Agenda";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<NewOrder />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/produtos" element={<Catalog />} />
        <Route path="/vendas" element={<Sales />} />
        <Route path="/estoque" element={<Stock />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/clientes" element={<Customers />} />
        <Route path="/clientes/:name" element={<CustomerDetail />} />
        <Route path="*" element={<NewOrder />} />
      </Route>
    </Routes>
  );
}
