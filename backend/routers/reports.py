import calendar
import re
from collections import defaultdict
from datetime import datetime
from typing import List, Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException

from lib.db import db
from models.report import Customer, PeriodSales, ProductSales, Receivables, CustomerReceivable, SalesReport

router = APIRouter()
TZ = ZoneInfo("America/Sao_Paulo")


def _local(iso: str) -> datetime:
    return datetime.fromisoformat(iso).astimezone(TZ)


@router.get("/customers", response_model=List[Customer])
async def list_customers():
    """Distinct past customers (case-insensitive), most recent first, with their last customer type."""
    docs = await db.orders.find(
        {}, {"_id": 0, "customer_name": 1, "customer_type": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(20000)
    seen: dict[str, Customer] = {}
    for d in docs:
        key = d["customer_name"].strip().lower()
        if key in seen:
            seen[key].orders_count += 1
        else:
            seen[key] = Customer(name=d["customer_name"].strip(), customer_type=d["customer_type"],
                                 orders_count=1, last_order_at=d["created_at"])
    return list(seen.values())


@router.get("/reports/receivables", response_model=Receivables)
async def receivables():
    """Unpaid orders grouped by customer (case-insensitive name), biggest balance first."""
    docs = await db.orders.find(
        {"paid": {"$ne": True}}, {"_id": 0, "customer_name": 1, "total": 1, "created_at": 1}
    ).sort("created_at", 1).to_list(20000)
    groups: dict[str, CustomerReceivable] = {}
    for d in docs:
        key = d["customer_name"].strip().lower()
        g = groups.get(key)
        if g:
            g.orders += 1
            g.total = round(g.total + d["total"], 2)
        else:
            groups[key] = CustomerReceivable(name=d["customer_name"].strip(), orders=1,
                                             total=round(d["total"], 2), oldest_order_at=d["created_at"])
    customers = sorted(groups.values(), key=lambda c: -c.total)
    return Receivables(total=round(sum(c.total for c in customers), 2), orders=len(docs), customers=customers)


@router.get("/reports/sales", response_model=SalesReport)
async def sales_report(month: Optional[str] = None):
    month = month or datetime.now(TZ).strftime("%Y-%m")
    if not re.fullmatch(r"\d{4}-\d{2}", month) or not 1 <= int(month[5:]) <= 12:
        raise HTTPException(status_code=422, detail="Mês inválido (use AAAA-MM)")
    docs = await db.orders.find({}, {"_id": 0, "created_at": 1, "total": 1, "items": 1}).to_list(50000)

    year, mon = int(month[:4]), int(month[5:])
    days = {f"{month}-{d:02d}": [0, 0.0] for d in range(1, calendar.monthrange(year, mon)[1] + 1)}
    months: dict[str, list] = defaultdict(lambda: [0, 0.0])
    products: dict[str, list] = defaultdict(lambda: [0, 0.0])
    for d in docs:
        dt = _local(d["created_at"])
        m = dt.strftime("%Y-%m")
        months[m][0] += 1
        months[m][1] += d["total"]
        if m == month:
            day = days[dt.strftime("%Y-%m-%d")]
            day[0] += 1
            day[1] += d["total"]
            for it in d["items"]:
                p = products[it["name"]]
                p[0] += it["quantity"]
                p[1] += it["price"] * it["quantity"]

    # Last 12 months ending at the selected month.
    month_keys = []
    y, mo = year, mon
    for _ in range(12):
        month_keys.append(f"{y}-{mo:02d}")
        y, mo = (y, mo - 1) if mo > 1 else (y - 1, 12)
    month_keys.reverse()

    top = sorted(products.items(), key=lambda kv: (-kv[1][0], -kv[1][1]))[:10]
    sel = months.get(month, [0, 0.0])
    return SalesReport(
        month=month,
        month_total=round(sel[1], 2),
        month_orders=sel[0],
        days=[PeriodSales(period=k, orders=v[0], total=round(v[1], 2)) for k, v in days.items()],
        months=[PeriodSales(period=k, orders=months.get(k, [0, 0.0])[0],
                            total=round(months.get(k, [0, 0.0])[1], 2)) for k in month_keys],
        top_products=[ProductSales(name=n, quantity=v[0], total=round(v[1], 2)) for n, v in top],
    )
