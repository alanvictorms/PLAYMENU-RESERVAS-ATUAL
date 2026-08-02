import os
from datetime import datetime, timedelta, timezone

import requests
from fastapi import HTTPException

from app_core import db, next_id, utcnow

def asaas_request(method: str, path: str, payload=None):
    key, base = os.environ.get("ASAAS_API_KEY", ""), os.environ.get("ASAAS_BASE_URL", "")
    if not key or not base:
        raise HTTPException(503, "Integração Asaas não configurada.")
    response = requests.request(method, base.rstrip("/") + path, json=payload, headers={"Content-Type": "application/json", "access_token": key, "User-Agent": "PGTO MENUPLAY"}, timeout=30)
    data = response.json() if response.content else {}
    if response.status_code >= 400:
        errors = " | ".join(f'{item.get("field", "")}: {item.get("description", "")}' for item in data.get("errors", []))
        raise HTTPException(502, errors or data.get("message") or f"Erro HTTP {response.status_code}")
    return data

def cycle_for(days):
    return {7: "WEEKLY", 15: "BIWEEKLY", 30: "MONTHLY", 90: "QUARTERLY", 180: "SEMIANNUALLY", 365: "YEARLY"}.get(int(days), "MONTHLY")

async def start_billing(restaurant_id: int, plan_id: int, billing_type="PIX"):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    plan = await db.plans.find_one({"id": plan_id, "is_active": 1}, {"_id": 0})
    if not restaurant or not plan: raise HTTPException(404, "Restaurante ou plano não encontrado.")
    document = restaurant.get("cpf_cnpj")
    if not document: raise HTTPException(422, "É necessário informar o CPF ou CNPJ para gerar o pagamento.")
    price = max(0, int(plan.get("price_cents", 0)) - plan_discount(plan))
    platform = await db.platform_settings.find_one({"id": 1}, {"_id": 0}) or {}
    adhesion = int(platform.get("adesao_cents", 29900))
    paid = await db.subscriptions_payments.find_one({"restaurant_id": restaurant_id, "kind": "adesao", "status": "paid"}, {"_id": 1})
    adhesion_paid = bool(paid or restaurant.get("activated_at"))
    kind, charge = ("mensalidade", price) if adhesion_paid else ("adesao", adhesion)
    customer_id = restaurant.get("asaas_customer_id")
    if not customer_id:
        found = asaas_request("GET", f'/customers?email={restaurant["email"]}')
        customer = (found.get("data") or [None])[0]
        if not customer:
            customer = asaas_request("POST", "/customers", {"name": restaurant["name"], "email": restaurant["email"], "cpfCnpj": document, "notificationDisabled": False})
        customer_id = customer["id"]
        await db.restaurants.update_one({"id": restaurant_id}, {"$set": {"asaas_customer_id": customer_id}})
    pending = await db.subscriptions_payments.find({"restaurant_id": restaurant_id, "status": "pending"}, {"_id": 0}).to_list(100)
    for old in pending:
        if old.get("asaas_payment_id"):
            try: asaas_request("DELETE", f'/payments/{old["asaas_payment_id"]}')
            except Exception: pass
        await db.subscriptions_payments.update_one({"id": old["id"]}, {"$set": {"status": "cancelled"}})
    description = f'Assinatura recorrente MenuPlay - {plan["name"]}' if kind == "mensalidade" else "Adesão MenuPlay"
    payment = asaas_request("POST", "/payments", {"customer": customer_id, "billingType": billing_type, "value": round(charge / 100, 2), "dueDate": (datetime.now(timezone.utc) + timedelta(days=3)).date().isoformat(), "description": description})
    record = {"id": await next_id("subscriptions_payments"), "restaurant_id": restaurant_id, "asaas_payment_id": payment["id"], "kind": kind, "plan_id": plan_id, "value_cents": charge, "status": "pending", "billing_type": billing_type, "created_at": utcnow()}
    await db.subscriptions_payments.insert_one(record.copy())
    sub_payload = {"billingType": billing_type, "value": round(price / 100, 2)}
    subscription_id = restaurant.get("asaas_subscription_id")
    subscription = asaas_request("PUT", f"/subscriptions/{subscription_id}", sub_payload) if subscription_id else None
    if not subscription or not subscription.get("id"):
        subscription = asaas_request("POST", "/subscriptions", {"customer": customer_id, **sub_payload, "cycle": cycle_for(plan.get("periodicity_days", 30)), "nextDueDate": (datetime.now(timezone.utc) + timedelta(days=max(1, int(plan.get("periodicity_days", 30))))).date().isoformat(), "description": "Assinatura MenuPlay"})
    await db.restaurants.update_one({"id": restaurant_id}, {"$set": {"asaas_subscription_id": subscription.get("id"), "plan_id": plan_id, "adesao_cents": adhesion, "mensalidade_cents": price}})
    pix = asaas_request("GET", f'/payments/{payment["id"]}/pixQrCode') if billing_type == "PIX" else None
    return {"success": True, "kind": kind, "charge_cents": charge, "payment": payment, "subscription": subscription, "pix_qr": pix, "invoiceUrl": payment.get("invoiceUrl")}

def plan_discount(plan):
    price = int(plan.get("price_cents", 0))
    if plan.get("discount_type") == "percent": return round(price * float(plan.get("discount_percent", 0)) / 100)
    if plan.get("discount_type") == "fixed": return min(price, int(plan.get("discount_value_cents", 0)))
    return 0

async def provision_payment(payment):
    payment_id = payment.get("id") or (payment.get("payment") or {}).get("id")
    if not payment_id: return
    record = await db.subscriptions_payments.find_one({"asaas_payment_id": payment_id}, {"_id": 0})
    if record and record.get("status") == "paid": return
    value = int(round(float(payment.get("value", 0)) * 100))
    restaurant_id, kind = (record or {}).get("restaurant_id"), (record or {}).get("kind", "mensalidade")
    if record:
        await db.subscriptions_payments.update_one({"id": record["id"]}, {"$set": {"status": "paid", "paid_at": utcnow(), "raw_json": payment}})
    else:
        restaurant = await db.restaurants.find_one({"asaas_subscription_id": payment.get("subscription")}, {"_id": 0})
        if not restaurant: return
        restaurant_id = restaurant["id"]
        record = {"id": await next_id("subscriptions_payments"), "restaurant_id": restaurant_id, "asaas_payment_id": payment_id, "asaas_subscription_id": payment.get("subscription"), "kind": kind, "value_cents": value, "status": "paid", "billing_type": payment.get("billingType", "PIX"), "paid_at": utcnow(), "raw_json": payment, "created_at": utcnow()}
        await db.subscriptions_payments.insert_one(record.copy())
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    plan = await db.plans.find_one({"id": restaurant.get("plan_id")}, {"_id": 0}) if restaurant else None
    expires = (datetime.now(timezone.utc) + timedelta(days=int((plan or {}).get("periodicity_days", 30)))).isoformat()
    update = {"subscription_expires_at": expires}
    if kind == "adesao": update.update({"status": "active", "is_active": 1, "activated_at": utcnow()})
    await db.restaurants.update_one({"id": restaurant_id}, {"$set": update})
    await generate_commissions(restaurant_id, record["id"], kind, value)

async def generate_commissions(restaurant_id, payment_id, kind, value):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    agent = await db.agents.find_one({"id": (restaurant or {}).get("seller_agent_id"), "is_active": 1}, {"_id": 0})
    if not agent: return
    field = "pct_adesao" if kind == "adesao" else "pct_mensalidade"
    available = (datetime.now(timezone.utc) + timedelta(days=7 if kind == "adesao" else 0)).isoformat()
    recipients = []
    if agent.get("role") == "representante" and agent.get("parent_id"):
        manager = await db.agents.find_one({"id": agent["parent_id"], "is_active": 1}, {"_id": 0})
        rep_pct, manager_pct = float(agent.get(field) or 0), float((manager or {}).get(field) or 0)
        recipients.append((agent["id"], rep_pct))
        if manager: recipients.append((manager["id"], max(0, manager_pct - rep_pct)))
    else: recipients.append((agent["id"], float(agent.get(field) or 0)))
    for agent_id, pct in recipients:
        amount = round(value * pct / 100)
        if amount > 0:
            await db.commissions.insert_one({"id": await next_id("commissions"), "agent_id": agent_id, "source_payment_id": payment_id, "restaurant_id": restaurant_id, "kind": kind, "base_cents": value, "pct": pct, "amount_cents": amount, "available_at": available, "status": "available", "created_at": utcnow()})