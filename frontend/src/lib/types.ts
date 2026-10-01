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
