from typing import List

from fastapi import APIRouter, HTTPException

from lib.db import db
from lib.stock import log_move
from models.packaging import Packaging, PackagingAdjust, PackagingInput, StockLogEntry

router = APIRouter()


@router.get("/packaging", response_model=List[Packaging])
async def list_packaging():
    docs = await db.packaging.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return [Packaging(**d) for d in docs]


@router.post("/packaging", response_model=Packaging)
async def create_packaging(data: PackagingInput):
    item = Packaging(**data.model_dump())
    await db.packaging.insert_one(item.model_dump())
    await log_move(item.id, item.name, item.quantity, "inicial", item.quantity)
    return item


@router.put("/packaging/{id}", response_model=Packaging)
async def update_packaging(id: str, data: PackagingInput):
    before = await db.packaging.find_one_and_update(
        {"id": id}, {"$set": data.model_dump()}, projection={"_id": 0}
    )
    if not before:
        raise HTTPException(status_code=404, detail="Embalagem não encontrada")
    await log_move(id, data.name, data.quantity - before["quantity"], "ajuste", data.quantity)
    return Packaging(**{**before, **data.model_dump()})


@router.post("/packaging/{id}/adjust", response_model=Packaging)
async def adjust_packaging(id: str, data: PackagingAdjust):
    doc = await db.packaging.find_one_and_update(
        {"id": id}, {"$inc": {"quantity": data.delta}}, projection={"_id": 0}, return_document=True
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Embalagem não encontrada")
    await log_move(id, doc["name"], data.delta, "entrada" if data.delta > 0 else "ajuste", doc["quantity"])
    return Packaging(**doc)


@router.get("/packaging/{id}/history", response_model=List[StockLogEntry])
async def packaging_history(id: str):
    docs = await db.stock_log.find({"packaging_id": id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [StockLogEntry(**d) for d in docs]


@router.delete("/packaging/{id}")
async def delete_packaging(id: str):
    res = await db.packaging.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Embalagem não encontrada")
    await db.stock_log.delete_many({"packaging_id": id})
    return {"ok": True}
