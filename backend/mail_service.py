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

DEFAULT_BASE_URL = "https://playmenu.app"

def public_base_url():
    """URL pública da aplicação usada nos links dos e-mails."""
    base = (os.environ.get("PUBLIC_BASE_URL") or "").strip().rstrip("/")
    if not base:
        return DEFAULT_BASE_URL
    if not base.startswith(("http://", "https://")):
        base = f"https://{base}"
    return base

def mail_layout(title: str, subtitle: str, body: str):
    """Layout escuro do e-mail, no mesmo visual da tela de recuperar senha."""
    base = public_base_url()
    return (
        '<div style="margin:0;padding:32px 16px;background:#201823;background-image:radial-gradient(circle at 75% 15%,rgba(244,88,28,0.18) 0%,rgba(32,24,35,0) 45%);font-family:Arial,Helvetica,sans-serif">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">'
        '<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:#2b2436;border-radius:24px;box-shadow:0 30px 80px rgba(0,0,0,0.5)">'
        '<tr><td style="padding:44px 40px">'
        f'<img src="{base}/public/assets/images/logopm.png" width="46" height="46" alt="PlayMenu" style="display:block;border:0;margin-bottom:22px" />'
        f'<h1 style="margin:0 0 10px;font-size:26px;line-height:1.25;font-weight:800;color:#ffffff">{title}</h1>'
        f'<p style="margin:0 0 26px;font-size:15px;line-height:1.55;color:#b9b3c4">{subtitle}</p>'
        f'{body}'
        '<p style="margin:30px 0 0;padding-top:22px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;line-height:1.6;color:#8d8798">'
        'Você recebeu este e-mail porque possui uma conta no PlayMenu. Se não foi você, ignore esta mensagem.</p>'
        '</td></tr></table>'
        '<p style="margin:18px 0 0;font-size:12px;color:#8d8798">© PlayMenu</p>'
        '</td></tr></table></div>'
    )

async def send_password_code(email, name, code):
    body = (
        f'<p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#ffffff">Olá, <strong>{name}</strong>.</p>'
        '<div style="background:#322c40;border-radius:12px;padding:22px;text-align:center">'
        f'<div style="font-size:32px;letter-spacing:10px;font-weight:800;color:#f97a4b">{code}</div>'
        '<div style="margin-top:10px;font-size:13px;color:#8d8798">O código expira em 15 minutos.</div>'
        '</div>'
    )
    html = mail_layout(
        "Recuperação de senha",
        "Use o código de 6 dígitos abaixo para criar uma nova senha na sua conta PlayMenu.",
        body,
    )
    return await send_mail(email, "Código de recuperação - PlayMenu", html, f"Seu código PlayMenu: {code}")

async def send_verification(role, user):
    collection = "agents" if role in {"gerente", "representante", "agent"} else "restaurants"
    token = uuid.uuid4().hex + uuid.uuid4().hex
    await db[collection].update_one({"id": user["id"]}, {"$set": {"email_verification_token": token, "email_verification_sent_at": utcnow()}})
    url = f"{public_base_url()}/validar-email?type={'agent' if collection == 'agents' else 'restaurant'}&token={token}"
    body = (
        f'<p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#ffffff">Olá, <strong>{user.get("name", "PlayMenu")}</strong>.</p>'
        f'<a href="{url}" style="display:block;background:#f4581c;color:#ffffff;padding:16px 20px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;text-align:center">Confirmar cadastro</a>'
        '<p style="margin:22px 0 6px;font-size:13px;color:#8d8798">Se o botão não funcionar, copie e cole o endereço abaixo no navegador:</p>'
        f'<p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;color:#f97a4b">{url}</p>'
    )
    html = mail_layout(
        "Confirme seu cadastro",
        "Seu restaurante já está configurado no PlayMenu. Falta apenas validar seu e-mail para liberar todos os recursos.",
        body,
    )
    await send_mail(user["email"], "Confirme seu cadastro - PlayMenu", html, f"Confirme seu cadastro: {url}")
    return token