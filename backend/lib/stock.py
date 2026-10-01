"""Packaging stock: each order item consumes the packaging whose name appears in the product name."""
import unicodedata
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


async def consume_for_items(items) -> tuple[list[dict], list[str]]:
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
        if doc and doc["quantity"] < 0:
            warnings.append(f"Estoque de {doc['name']} ficou negativo ({doc['quantity']})")
        elif doc and doc["quantity"] <= doc.get("min_quantity", 0):
            warnings.append(f"Estoque de {doc['name']} baixo ({doc['quantity']})")
    return list(totals.values()), warnings


async def restore_moves(moves: list[dict]) -> None:
    for m in moves:
        await db.packaging.update_one({"id": m["packaging_id"]}, {"$inc": {"quantity": m["quantity"]}})
