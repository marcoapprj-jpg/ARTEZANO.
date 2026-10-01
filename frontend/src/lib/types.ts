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
  delivery: string;
  notes: string;
}

export interface Order extends OrderInput {
  id: string;
  total: number;
  created_at: string;
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
