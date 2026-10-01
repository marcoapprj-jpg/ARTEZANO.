"""Packaging stock: each order item consumes the packaging whose name appears in the product name."""
import unicodedata
import uuid
from datetime import datetime, timezone
from typing import Iterable, List, Optional

from lib.db import db


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    return " ".join("".join(c for c in s if unicodedata.category(c) != "Mn").upper().split())


def match_packaging(product_name: str, packagings: Iterable[dict]) -> Optional[dict]:
    """Longest packaging name contained in the product name (so 'FORMA 500' beats 'FORMA')."""
    pn = norm(product_name)
    best = None
    for p in packagings:
        key = norm(p["name"])
        if key and key in pn and (best is None or len(key) > len(norm(best["name"]))):
            best = p
    return best


async def log_move(packaging_id: str, name: str, delta: int, kind: str, balance: int,
                   order_number: Optional[int] = None) -> None:
    """kind: inicial | entrada | ajuste | pedido | devolucao"""
    if delta == 0 and kind != "inicial":
        return
    await db.stock_log.insert_one({
        "id": str(uuid.uuid4()), "packaging_id": packaging_id, "packaging_name": name,
        "delta": delta, "kind": kind, "balance": balance, "order_number": order_number,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


async def consume_for_items(items, order_number: int) -> tuple[list[dict], list[str]]:
    """Deduct stock for order items. Returns (stock_moves, warnings)."""
    packagings = await db.packaging.find({}, {"_id": 0}).to_list(1000)
    totals: dict[str, dict] = {}
    for it in items:
        p = match_packaging(it.name, packagings)
        if p:
            m = totals.setdefault(p["id"], {"packaging_id": p["id"], "name": p["name"], "quantity": 0})
            m["quantity"] += it.quantity
    warnings: List[str] = []
    for m in totals.values():
        doc = await db.packaging.find_one_and_update(
            {"id": m["packaging_id"]}, {"$inc": {"quantity": -m["quantity"]}},
            projection={"_id": 0}, return_document=True,
        )
        if not doc:
            continue
        await log_move(doc["id"], doc["name"], -m["quantity"], "pedido", doc["quantity"], order_number)
        if doc["quantity"] < 0:
            warnings.append(f"Estoque de {doc['name']} ficou negativo ({doc['quantity']})")
        elif doc["quantity"] <= doc.get("min_quantity", 0):
            warnings.append(f"Estoque de {doc['name']} baixo ({doc['quantity']})")
    return list(totals.values()), warnings


async def restore_moves(moves: list[dict], order_number: int) -> None:
    for m in moves:
        doc = await db.packaging.find_one_and_update(
            {"id": m["packaging_id"]}, {"$inc": {"quantity": m["quantity"]}},
            projection={"_id": 0}, return_document=True,
        )
        if doc:
            await log_move(doc["id"], doc["name"], m["quantity"], "devolucao", doc["quantity"], order_number)
