import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class ProductInput(BaseModel):
    name: str = Field(min_length=1)
    sku: str = ""
    price: float = Field(ge=0)


class Product(ProductInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
