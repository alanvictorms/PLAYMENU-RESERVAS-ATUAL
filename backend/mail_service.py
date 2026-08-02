import asyncio
import os
import smtplib
import ssl
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app_core import db, utcnow

async def smtp_config():
    rows = await db.app_settings.find({"setting_key": {"$regex": "^smtp_"}}, {"_id": 0}).to_list(20)
    values = {row["setting_key"]: row.get("setting_value", "") for row in rows}
    return {
        "host": values.get("smtp_host") or os.environ.get("SMTP_HOST", ""),
        "port": int(values.get("smtp_port") or os.environ.get("SMTP_PORT", "465")),
        "secure": values.get("smtp_secure") or os.environ.get("SMTP_SECURE", "ssl"),
        "user": values.get("smtp_user") or os.environ.get("SMTP_USER", ""),
        "pass": values.get("smtp_pass") or os.environ.get("SMTP_PASS", ""),
        "from": values.get("smtp_from") or os.environ.get("SMTP_FROM", ""),
        "from_name": values.get("smtp_from_name") or os.environ.get("SMTP_FROM_NAME", "PlayMenu"),
    }

async def send_mail(to: str, subject: str, html: str, text: str = ""):
    config = await smtp_config()
    if not all([config["host"], config["user"], config["pass"]]):
        raise RuntimeError("SMTP ainda não configurado.")
    msg = MIMEMultipart("alternative")
    msg["Subject"], msg["From"], msg["To"] = subject, f'{config["from_name"]} <{config["from"] or config["user"]}>', to
    msg.attach(MIMEText(text or "Mensagem PlayMenu", "plain", "utf-8")); msg.attach(MIMEText(html, "html", "utf-8"))
    def deliver():
        if config["secure"] == "ssl":
            with smtplib.SMTP_SSL(config["host"], config["port"], context=ssl.create_default_context()) as smtp:
                smtp.login(config["user"], config["pass"]); smtp.send_message(msg)
        else:
            with smtplib.SMTP(config["host"], config["port"]) as smtp:
                if config["secure"] == "tls": smtp.starttls(context=ssl.create_default_context())
                smtp.login(config["user"], config["pass"]); smtp.send_message(msg)
    await asyncio.to_thread(deliver)
    return True

async def send_password_code(email, name, code):
    html = f'<div style="font-family:Arial;background:#f7f7f7;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;border-radius:14px;padding:26px"><h2>Recuperação de senha PlayMenu</h2><p>Olá, <strong>{name}</strong>.</p><p>Use o código abaixo. Ele expira em 15 minutos.</p><div style="font-size:30px;letter-spacing:8px;font-weight:800;color:#f0642a">{code}</div></div></div>'
    return await send_mail(email, "Código de recuperação - PlayMenu", html, f"Seu código PlayMenu: {code}")

async def send_verification(role, user):
    collection = "agents" if role in {"gerente", "representante", "agent"} else "restaurants"
    token = uuid.uuid4().hex + uuid.uuid4().hex
    await db[collection].update_one({"id": user["id"]}, {"$set": {"email_verification_token": token, "email_verification_sent_at": utcnow()}})
    base = os.environ.get("PUBLIC_BASE_URL", "")
    url = f"{base}/validar-email?type={'agent' if collection == 'agents' else 'restaurant'}&token={token}"
    html = f'<div style="font-family:Arial;background:#f7f7f7;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;border-radius:14px;padding:26px"><h2>Valide seu e-mail no PlayMenu</h2><p>Olá, <strong>{user.get("name", "PlayMenu")}</strong>.</p><p><a href="{url}" style="background:#f0642a;color:#fff;padding:13px 18px;border-radius:10px;text-decoration:none">Confirmar e-mail</a></p></div></div>'
    await send_mail(user["email"], "Confirme seu e-mail - PlayMenu", html)
    return token