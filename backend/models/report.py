from typing import List

from pydantic import BaseModel

from models.order import CustomerType


class Customer(BaseModel):
    name: str
    customer_type: CustomerType
    orders_count: int
    last_order_at: str
    total_bought: float = 0
    outstanding: float = 0
    open_orders: int = 0


class PeriodSales(BaseModel):
    period: str  # YYYY-MM-DD for days, YYYY-MM for months
    orders: int
    total: float


class ProductSales(BaseModel):
    name: str
    quantity: int
    total: float


class SalesReport(BaseModel):
    month: str
    month_total: float
    month_orders: int
    days: List[PeriodSales]
    months: List[PeriodSales]
    top_products: List[ProductSales]


class CustomerReceivable(BaseModel):
    name: str
    orders: int
    total: float
    oldest_order_at: str


class Receivables(BaseModel):
    total: float
    orders: int
    customers: List[CustomerReceivable]
