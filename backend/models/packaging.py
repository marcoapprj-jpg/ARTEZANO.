import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field


class PackagingInput(BaseModel):
    name: str = Field(min_length=1)
    quantity: int = 0
    min_quantity: int = Field(default=0, ge=0)


class Packaging(PackagingInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PackagingAdjust(BaseModel):
    delta: int


class StockLogEntry(BaseModel):
    id: str
    packaging_id: str
    packaging_name: str
    delta: int
    kind: Literal["inicial", "entrada", "ajuste", "pedido", "devolucao"]
    balance: int
    order_number: Optional[int] = None
    created_at: str
