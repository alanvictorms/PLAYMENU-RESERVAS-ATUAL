import os
from datetime import datetime, timedelta, timezone

import requests
from fastapi import HTTPException

from app_core import db, next_id, utcnow

ASAAS_DEFAULT_BASE_URL = "https://api.asaas.com/v3"

async def get_asaas_credentials():
    rows = {r["setting_key"]: r.get("setting_value", "") for r in await db.app_settings.find({"setting_key": {"$in": ["asaas_api_key", "asaas_base_url"]}}, {"_id": 0}).to_list(10)}
    key = rows.get("asaas_api_key") or os.environ.get("ASAAS_API_KEY", "")
    base = rows.get("asaas_base_url") or os.environ.get("ASAAS_BASE_URL", "") or ASAAS_DEFAULT_BASE_URL
    return key, base

async def get_asaas_webhook_secret():
    row = await db.app_settings.find_one({"setting_key": "asaas_webhook_secret"}, {"_id": 0})
    return (row or {}).get("setting_value") or os.environ.get("ASAAS_WEBHOOK_SECRET", "")

def asaas_request(method: str, path: str, payload=None, key=None, base=None):
    key = key if key is not None else os.environ.get("ASAAS_API_KEY", "")
    base = base if base is not None else (os.environ.get("ASAAS_BASE_URL", "") or ASAAS_DEFAULT_BASE_URL)
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

OPEN_PAYMENT_STATUS = {"PENDING", "OVERDUE", "AWAITING_RISK_ANALYSIS"}

async def ensure_customer(restaurant, key, base):
    customer_id = restaurant.get("asaas_customer_id")
    if customer_id: return customer_id
    document = restaurant.get("cpf_cnpj")
    if not document: raise HTTPException(422, "É necessário informar o CPF ou CNPJ para gerar o pagamento.")
    found = asaas_request("GET", f'/customers?email={restaurant["email"]}', key=key, base=base)
    customer = (found.get("data") or [None])[0]
    if not customer:
        customer = asaas_request("POST", "/customers", {"name": restaurant["name"], "email": restaurant["email"], "cpfCnpj": document, "notificationDisabled": False}, key=key, base=base)
    await db.restaurants.update_one({"id": restaurant["id"]}, {"$set": {"asaas_customer_id": customer["id"]}})
    return customer["id"]

def pix_qr_code(payment_id: str, billing_type: str, key, base):
    # A chamada precisa receber as credenciais salvas no painel: sem elas o Asaas
    # devolve 401 e o restaurante vê "Integração Asaas não configurada" no lugar do QR.
    if billing_type != "PIX": return None
    try: return asaas_request("GET", f"/payments/{payment_id}/pixQrCode", key=key, base=base)
    except HTTPException: return None

async def start_billing(restaurant_id: int, plan_id: int, billing_type="PIX"):
    key, base = await get_asaas_credentials()
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    plan = await db.plans.find_one({"id": plan_id, "is_active": 1}, {"_id": 0})
    if not restaurant or not plan: raise HTTPException(404, "Restaurante ou plano não encontrado.")
    price = max(0, int(plan.get("price_cents", 0)) - plan_discount(plan))
    customer_id = await ensure_customer(restaurant, key, base)
    pending = await db.subscriptions_payments.find({"restaurant_id": restaurant_id, "status": "pending"}, {"_id": 0}).to_list(100)
    for old in pending:
        if old.get("asaas_payment_id"):
            try: asaas_request("DELETE", f'/payments/{old["asaas_payment_id"]}', key=key, base=base)
            except Exception: pass
        await db.subscriptions_payments.update_one({"id": old["id"]}, {"$set": {"status": "cancelled"}})
    # Uma única cobrança por contratação: a assinatura do plano escolhido. A primeira
    # parcela já nasce com vencimento hoje, então é ela que o restaurante paga agora —
    # nada de cobrança avulsa de adesão em paralelo.
    sub_payload = {"billingType": billing_type, "value": round(price / 100, 2), "cycle": cycle_for(plan.get("periodicity_days", 30)), "description": f'Assinatura MenuPlay - {plan["name"]}'}
    subscription_id = restaurant.get("asaas_subscription_id")
    subscription = None
    if subscription_id:
        try: subscription = asaas_request("PUT", f"/subscriptions/{subscription_id}", {**sub_payload, "updatePendingPayments": True}, key=key, base=base)
        except HTTPException: subscription = None
    if not subscription or not subscription.get("id"):
        subscription = asaas_request("POST", "/subscriptions", {"customer": customer_id, **sub_payload, "nextDueDate": datetime.now(timezone.utc).date().isoformat()}, key=key, base=base)
    charges = (asaas_request("GET", f'/subscriptions/{subscription["id"]}/payments', key=key, base=base) or {}).get("data") or []
    payment = next((item for item in sorted(charges, key=lambda row: row.get("dueDate") or "") if item.get("status") in OPEN_PAYMENT_STATUS), None)
    if not payment:
        payment = asaas_request("POST", "/payments", {"customer": customer_id, "billingType": billing_type, "value": round(price / 100, 2), "dueDate": (datetime.now(timezone.utc) + timedelta(days=3)).date().isoformat(), "description": sub_payload["description"], "subscription": subscription["id"]}, key=key, base=base)
    charge = int(round(float(payment.get("value") or 0) * 100)) or price
    record = {"id": await next_id("subscriptions_payments"), "restaurant_id": restaurant_id, "asaas_payment_id": payment["id"], "asaas_subscription_id": subscription.get("id"), "kind": "mensalidade", "plan_id": plan_id, "value_cents": charge, "status": "pending", "billing_type": billing_type, "created_at": utcnow()}
    await db.subscriptions_payments.insert_one(record.copy())
    await db.restaurants.update_one({"id": restaurant_id}, {"$set": {"asaas_subscription_id": subscription.get("id"), "plan_id": plan_id, "mensalidade_cents": price}})
    return {"success": True, "kind": "mensalidade", "charge_cents": charge, "payment": payment, "subscription": subscription, "pix_qr": pix_qr_code(payment["id"], billing_type, key, base), "invoiceUrl": payment.get("invoiceUrl")}

def plan_discount(plan):
    price = int(plan.get("price_cents", 0))
    if plan.get("discount_type") == "percent": return round(price * float(plan.get("discount_percent", 0)) / 100)
    if plan.get("discount_type") == "fixed": return min(price, int(plan.get("discount_value_cents", 0)))
    return 0

async def provision_video_request(payment_id: str, payment):
    # Solicitações de vídeo só chegam ao Super Admin depois que o pagamento é confirmado.
    request = await db.video_requests.find_one({"asaas_payment_id": payment_id}, {"_id": 0})
    if not request: return False
    if request.get("payment_status") != "paid":
        await db.video_requests.update_one({"id": request["id"]}, {"$set": {"payment_status": "paid", "paid_at": utcnow(), "status": "pending" if request.get("status") in {"awaiting_payment", "cancelled"} else request.get("status", "pending"), "payment_raw": payment}})
    return True

async def provision_payment(payment):
    payment_id = payment.get("id") or (payment.get("payment") or {}).get("id")
    if not payment_id: return
    if await provision_video_request(payment_id, payment): return
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
    # Sem cobrança de adesão, é o primeiro pagamento do plano que ativa a conta — e é
    # sobre ele que o agente recebe a comissão de venda (pct_adesao).
    first_payment = not (restaurant or {}).get("activated_at")
    update = {"subscription_expires_at": expires, "status": "active", "is_active": 1}
    if first_payment: update["activated_at"] = utcnow()
    await db.restaurants.update_one({"id": restaurant_id}, {"$set": update})
    await generate_commissions(restaurant_id, record["id"], "adesao" if first_payment else kind, value)

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