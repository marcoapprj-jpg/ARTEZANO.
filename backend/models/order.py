import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, computed_field

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
    delivery_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    delivery: str = ""
    notes: str = ""


class StockMove(BaseModel):
    packaging_id: str
    name: str
    quantity: int


class PaymentInput(BaseModel):
    amount: float = Field(gt=0)
    note: str = ""


class Payment(PaymentInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Order(OrderInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    total: float = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    paid: bool = False
    paid_at: Optional[str] = None
    stock_moves: List[StockMove] = []
    payments: List[Payment] = []

    @computed_field
    @property
    def paid_amount(self) -> float:
        return round(sum(p.amount for p in self.payments), 2)

    @computed_field
    @property
    def balance(self) -> float:
        """Amount still to receive; 0 once the order is marked paid."""
        return 0.0 if self.paid else round(max(0.0, self.total - self.paid_amount), 2)


class OrderSaved(Order):
    stock_warnings: List[str] = []


class PaidUpdate(BaseModel):
    paid: bool


class NextNumber(BaseModel):
    next_number: int


class AgendaDay(BaseModel):
    date: str
    orders: List[Order]


class Agenda(BaseModel):
    today: str
    overdue: List[Order]  # delivery date before today (last 30 days)
    days: List[AgendaDay]
    undated: int
