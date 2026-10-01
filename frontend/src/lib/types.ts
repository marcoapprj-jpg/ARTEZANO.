// Mirrors backend/models/product.py and backend/models/order.py — keep in sync.
export interface ProductInput {
  name: string;
  sku: string;
  price: number;
}

export interface Product extends ProductInput {
  id: string;
  created_at: string;
}

export type CustomerType = "revenda" | "cliente_final";

export interface OrderItem {
  product_id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

export interface OrderInput {
  number: number;
  customer_name: string;
  customer_type: CustomerType;
  items: OrderItem[];
  payment_method: string;
  payment_term: string;
  delivery_date: string | null;
  delivery: string;
  notes: string;
}

export interface StockMove {
  packaging_id: string;
  name: string;
  quantity: number;
}

export interface PaymentInput {
  amount: number;
  note: string;
}

export interface Payment extends PaymentInput {
  id: string;
  created_at: string;
}

export interface Order extends OrderInput {
  id: string;
  total: number;
  created_at: string;
  paid: boolean;
  paid_at: string | null;
  stock_moves: StockMove[];
  payments: Payment[];
  paid_amount: number;
  balance: number;
}

export interface AgendaDay {
  date: string;
  orders: Order[];
}

export interface Agenda {
  today: string;
  overdue: Order[];
  days: AgendaDay[];
  undated: number;
}

export interface OrderSaved extends Order {
  stock_warnings: string[];
}

// Mirrors backend/models/packaging.py
export interface PackagingInput {
  name: string;
  quantity: number;
  min_quantity: number;
}

export interface Packaging extends PackagingInput {
  id: string;
  created_at: string;
}

export type StockKind = "inicial" | "entrada" | "ajuste" | "pedido" | "devolucao";

export interface StockLogEntry {
  id: string;
  packaging_id: string;
  packaging_name: string;
  delta: number;
  kind: StockKind;
  balance: number;
  order_number: number | null;
  created_at: string;
}

export interface CustomerReceivable {
  name: string;
  orders: number;
  total: number;
  oldest_order_at: string;
}

export interface Receivables {
  total: number;
  orders: number;
  customers: CustomerReceivable[];
}

export interface NextNumber {
  next_number: number;
}

// Mirrors backend/models/report.py
export interface Customer {
  name: string;
  customer_type: CustomerType;
  orders_count: number;
  last_order_at: string;
  total_bought: number;
  outstanding: number;
  open_orders: number;
}

export interface PeriodSales {
  period: string;
  orders: number;
  total: number;
}

export interface ProductSales {
  name: string;
  quantity: number;
  total: number;
}

export interface SalesReport {
  month: string;
  month_total: number;
  month_orders: number;
  days: PeriodSales[];
  months: PeriodSales[];
  top_products: ProductSales[];
}

/** Router state used to prefill the new-order form from an old order. */
export interface RepeatOrderState {
  repeat: Pick<OrderInput, "customer_name" | "customer_type" | "items" | "payment_method" | "payment_term">;
}
