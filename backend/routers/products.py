from typing import List

from fastapi import APIRouter, HTTPException

from lib.db import db
from models.product import Product, ProductInput

router = APIRouter()


@router.get("/products", response_model=List[Product])
async def list_products():
    docs = await db.products.find({}, {"_id": 0}).sort("name", 1).to_list(2000)
    return [Product(**d) for d in docs]


@router.post("/products", response_model=Product)
async def create_product(data: ProductInput):
    product = Product(**data.model_dump())
    await db.products.insert_one(product.model_dump())
    return product


@router.put("/products/{id}", response_model=Product)
async def update_product(id: str, data: ProductInput):
    res = await db.products.find_one_and_update(
        {"id": id}, {"$set": data.model_dump()}, projection={"_id": 0}, return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return Product(**res)


@router.delete("/products/{id}")
async def delete_product(id: str):
    res = await db.products.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return {"ok": True}
