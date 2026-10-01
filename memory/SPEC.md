# Artezano Pudim — Lançador de Pedidos

Multi-user (no login, shared link) order launcher for a pudim bakery. UI in pt-BR.

## Pages
- `/` Novo pedido: Pedido Nº (auto-suggested = max(number)+1, editable), Nome, tipo (Cliente Final | Revenda),
  item picker sheet (multi-select, stays open until "Concluir seleção"), Forma de pagamento (chips Pix/Dinheiro/Cartão/Boleto + free text),
  Prazo (chips À vista/7/14/28 dias + free text), Entrega (free text), Observações. Buttons: "Salvar e enviar no WhatsApp"
  (opens wa.me/?text= with items in *bold*, contact chosen in WhatsApp) and "Apenas salvar". After save form resets with next number.
- `/pedidos` Histórico: search, Excel export (`/api/orders/export`, sheets "Pedidos" and "Itens" incl. SKU), click card → dialog with
  "Enviar PDF pelo WhatsApp" (jsPDF, navigator.share with files, falls back to download), "Reenviar texto", "Excluir".
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
