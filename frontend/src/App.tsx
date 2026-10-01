import { Routes, Route } from "react-router-dom";
import AppShell from "@/components/AppShell";
import NewOrder from "@/pages/NewOrder";
import Orders from "@/pages/Orders";
import Catalog from "@/pages/Catalog";
import Sales from "@/pages/Sales";
import Stock from "@/pages/Stock";

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
        <Route path="*" element={<NewOrder />} />
      </Route>
    </Routes>
  );
}
