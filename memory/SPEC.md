# Artezano Pudim — Lançador de Pedidos

Multi-user (no login, shared link) order launcher for a pudim bakery. UI in pt-BR.

## Pages
- `/` Novo pedido: Pedido Nº (auto-suggested = max(number)+1, editable), Nome, tipo (Cliente Final | Revenda),
  item picker sheet (multi-select, stays open until "Concluir seleção"), Forma de pagamento (chips Pix/Dinheiro/Cartão/Boleto + free text),
  Prazo (chips À vista/7/14/28 dias + free text), Entrega (free text), Observações. Buttons: "Salvar e enviar no WhatsApp"
  (opens wa.me/?text= with items in *bold*, contact chosen in WhatsApp) and "Apenas salvar". After save form resets with next number.
- `/pedidos` Histórico: search, Excel export (`/api/orders/export`, sheets "Pedidos" and "Itens" incl. SKU), click card → dialog with
  "Enviar PDF pelo WhatsApp" (jsPDF, navigator.share with files, falls back to download), "Reenviar texto", "Excluir".
- Order number field is fully editable (can be cleared and retyped). Next suggestion = number of the LAST SAVED order + 1 (skips taken numbers).
- Customer autocomplete on Nome (>=2 letters) from past orders (`GET /api/customers`); picking sets customer type if no items yet.
- "Repetir pedido" in history dialog → prefills Novo pedido (name, type, items at current catalog prices, payment, term) via router state.
- `/vendas` Vendas: month selector, month total/orders, daily bar chart, last-12-months chart, top 10 products (`GET /api/reports/sales?month=YYYY-MM`, tz America/Sao_Paulo).
- WhatsApp text and PDF do NOT include SKU (Excel export still does).
- `/estoque` Embalagens (packaging collection {id,name,quantity,min_quantity}): add/edit/delete, "Entrada" (+qty), low/negative alerts.
  Each order item deducts its quantity from the packaging whose (accent/case-insensitive) name is contained in the product name
  (longest match wins, e.g. "FORMA 500" over "FORMA"). Moves stored on order.stock_moves; deleting an order restores them.
  Saving is never blocked; negative/low stock returns `stock_warnings` (toasts). Endpoints: GET/POST /packaging, PUT/DELETE /packaging/{id}, POST /packaging/{id}/adjust {delta}.
- Paid flag: order.paid / paid_at, PATCH /orders/{id}/paid {paid}. History has "Quitar" toggle per card + filter Todos/Pendentes/Quitados;
  unmarking a paid order asks confirmation dialog. Excel has "Quitado" column.
- `/produtos` Catálogo: create / edit (name, SKU, price) / delete.

## Rules
- Product is "revenda" iff its name contains "revenda" (case-insensitive). Revenda orders show only those; Cliente Final shows the rest.
- Order number unique (409 on duplicate).

## Data model (Mongo)
- products: {id, name, sku, price, created_at}
- orders: {id, number(unique), customer_name, customer_type: revenda|cliente_final, items:[{product_id,name,sku,price,quantity}],
  payment_method, payment_term, delivery, notes, total, created_at(ISO UTC)}

## API (/api)
GET/POST /products, PUT/DELETE /products/{id}; GET /orders, GET /orders/next-number, GET /orders/export, GET/DELETE /orders/{id}, POST /orders

## Seed
`cd backend && python seed.py` — 7 products (5 cliente final, 2 with "Revenda" in name) if catalog empty.
No auth.
- Stock log: collection stock_log {id, packaging_id, packaging_name, delta, kind: inicial|entrada|ajuste|pedido|devolucao, balance, order_number, created_at};
  GET /packaging/{id}/history. "Histórico" button per packaging card in /estoque.
- Receivables: GET /reports/receivables → {total, orders, customers:[{name, orders, total, oldest_order_at}]} (unpaid orders grouped by customer); shown in /vendas "A receber por cliente".
- Paid orders: WhatsApp text adds "✅ *PAGO*" line; PDF shows a green "PAGO" stamp.
