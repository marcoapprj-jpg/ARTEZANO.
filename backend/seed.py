"""Idempotent seed: inserts starter products only when the catalog is empty."""
import asyncio

from lib.db import db, ensure_indexes
from models.product import Product

PRODUCTS = [
    ("Pudim Tradicional 1kg", "PT-1KG", 65.0),
    ("Pudim Individual 120g", "PI-120", 12.0),
    ("Pudim de Doce de Leite 1kg", "PDL-1KG", 75.0),
    ("Pudim de Chocolate Belga 1kg", "PCB-1KG", 80.0),
    ("Pudim de Pistache 1kg", "PPI-1KG", 95.0),
    ("Pudim Revenda Pote 120g (Cx c/ 12)", "RV-120-12", 96.0),
    ("Pudim Revenda Grande 1kg (Cx c/ 4)", "RV-1KG-4", 200.0),
]


async def main():
    await ensure_indexes()
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many(
            [Product(name=n, sku=s, price=p).model_dump() for n, s, p in PRODUCTS]
        )
        print(f"seeded {len(PRODUCTS)} products")
    else:
        print("products already present")


if __name__ == "__main__":
    asyncio.run(main())
