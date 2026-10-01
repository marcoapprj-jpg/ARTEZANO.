import uuid
from datetime import datetime, timezone
from typing import List, Literal

from pydantic import BaseModel, Field

CustomerType = Literal["revenda", "cliente_final"]


class OrderItem(BaseModel):
    product_id: str
    name: str
    sku: str = ""
    price: float = Field(ge=0)
    quantity: int = Field(ge=1)


class OrderInput(BaseModel):
    number: int = Field(ge=1)
    customer_name: str = Field(min_length=1)
    customer_type: CustomerType
    items: List[OrderItem] = Field(min_length=1)
    payment_method: str = ""
    payment_term: str = ""
    delivery: str = ""
    notes: str = ""


class Order(OrderInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    total: float = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class NextNumber(BaseModel):
    next_number: int
