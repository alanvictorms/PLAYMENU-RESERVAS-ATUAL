from fastapi import HTTPException

from app_core import clean_doc, db, next_id, utcnow

DEFAULT_QR_TEMPLATES = [
    {
        "name": "Adesivo de mesa",
        "description": "Arte quadrada para mesas, balcões e totens.",
        "width": 1080,
        "height": 1080,
        "qr_x": 340,
        "qr_y": 480,
        "qr_size": 400,
        "logo_x": 440,
        "logo_y": 80,
        "logo_size": 200,
        "builtin_theme": "table",
    },
    {
        "name": "Porta-guardanapo",
        "description": "Formato horizontal para porta-guardanapos e displays.",
        "width": 1400,
        "height": 900,
        "qr_x": 850,
        "qr_y": 230,
        "qr_size": 450,
        "logo_x": 120,
        "logo_y": 90,
        "logo_size": 190,
        "builtin_theme": "napkin",
    },
    {
        "name": "Plaquinha A5",
        "description": "Formato vertical de alta resolução para impressão.",
        "width": 1240,
        "height": 1754,
        "qr_x": 320,
        "qr_y": 820,
        "qr_size": 600,
        "logo_x": 470,
        "logo_y": 120,
        "logo_size": 300,
        "builtin_theme": "sign",
    },
]


async def ensure_default_qr_templates():
    marker = await db.migration_state.find_one({"name": "qr_templates_v1"}, {"_id": 1})
    if marker:
        return
    first_id = await next_id("qr_templates")
    documents = []
    for offset, template in enumerate(DEFAULT_QR_TEMPLATES):
        documents.append(
            {
                "id": first_id + offset,
                **template,
                "template_file": None,
                "background_color": "#201827",
                "accent_color": "#f4581c",
                "is_active": 1,
                "created_at": utcnow(),
                "updated_at": utcnow(),
            }
        )
    if documents:
        await db.qr_templates.insert_many([document.copy() for document in documents])
    await db.migration_state.insert_one({"name": "qr_templates_v1", "created_at": utcnow()})


def validate_qr_template(values: dict) -> dict:
    numeric = {}
    for key in ["width", "height", "qr_x", "qr_y", "qr_size", "logo_x", "logo_y", "logo_size"]:
        try:
            numeric[key] = int(values.get(key) or 0)
        except (TypeError, ValueError) as exc:
            raise HTTPException(422, f"O campo {key} deve ser numérico.") from exc
    if not 400 <= numeric["width"] <= 5000 or not 400 <= numeric["height"] <= 5000:
        raise HTTPException(422, "A arte deve ter entre 400 e 5000 pixels em cada dimensão.")
    if not 120 <= numeric["qr_size"] <= min(numeric["width"], numeric["height"]):
        raise HTTPException(422, "O QR Code deve ter pelo menos 120 pixels e caber na arte.")
    if not 40 <= numeric["logo_size"] <= min(numeric["width"], numeric["height"]):
        raise HTTPException(422, "O tamanho do logo é inválido.")
    if numeric["qr_x"] < 0 or numeric["qr_y"] < 0 or numeric["qr_x"] + numeric["qr_size"] > numeric["width"] or numeric["qr_y"] + numeric["qr_size"] > numeric["height"]:
        raise HTTPException(422, "A área do QR Code ultrapassa os limites da arte.")
    if numeric["logo_x"] < 0 or numeric["logo_y"] < 0 or numeric["logo_x"] + numeric["logo_size"] > numeric["width"] or numeric["logo_y"] + numeric["logo_size"] > numeric["height"]:
        raise HTTPException(422, "A área do logo ultrapassa os limites da arte.")
    name = str(values.get("name") or "").strip()[:100]
    if not name:
        raise HTTPException(422, "Informe o nome do modelo.")
    return {
        "name": name,
        "description": str(values.get("description") or "").strip()[:300] or None,
        **numeric,
        "background_color": str(values.get("background_color") or "#201827")[:20],
        "accent_color": str(values.get("accent_color") or "#f4581c")[:20],
        "is_active": int(bool(values.get("is_active", True))),
        "updated_at": utcnow(),
    }


async def active_qr_templates() -> list[dict]:
    await ensure_default_qr_templates()
    rows = await db.qr_templates.find({"is_active": 1}, {"_id": 0}).sort("id", 1).to_list(100)
    return [clean_doc(row) for row in rows]
