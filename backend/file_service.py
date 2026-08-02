import mimetypes

from bson import ObjectId
from fastapi import HTTPException, UploadFile
from starlette.responses import StreamingResponse

from app_core import files, new_file_name

ALLOWED = {
    "thumbs": ({"png", "jpg", "jpeg", "webp"}, 5 * 1024 * 1024),
    "branding": ({"png", "jpg", "jpeg", "webp"}, 5 * 1024 * 1024),
    "videos": ({"mp4", "mov", "m4v", "webm"}, 120 * 1024 * 1024),
    "models3d": ({"glb", "gltf"}, 50 * 1024 * 1024),
    "materials": ({"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "webm", "mkv", "avi", "zip"}, 300 * 1024 * 1024),
    "bio": ({"png", "jpg", "jpeg", "webp", "gif", "pdf"}, 5 * 1024 * 1024),
    "qr_templates": ({"png", "jpg", "jpeg", "webp"}, 15 * 1024 * 1024),
}

async def save_upload(upload: UploadFile | None, folder: str, max_override=None):
    if not upload or not upload.filename:
        return None
    extension = upload.filename.rsplit(".", 1)[-1].lower() if "." in upload.filename else ""
    extensions, maximum = ALLOWED[folder]
    maximum = max_override or maximum
    if extension not in extensions:
        raise HTTPException(422, "Tipo de arquivo não permitido.")
    content = await upload.read(maximum + 1)
    if len(content) > maximum:
        raise HTTPException(413, "Arquivo excede o limite permitido.")
    stored_name = new_file_name(upload.filename, folder)
    file_id = await files.upload_from_stream(stored_name, content, metadata={"content_type": upload.content_type, "original_name": upload.filename})
    return {"path": f"/api/files/{file_id}", "stored_name": stored_name, "size": len(content), "original_name": upload.filename}

async def stream_file(file_id: str):
    try:
        stream = await files.open_download_stream(ObjectId(file_id))
    except Exception:
        raise HTTPException(404, "Arquivo não encontrado.")
    content_type = (stream.metadata or {}).get("content_type") or mimetypes.guess_type(stream.filename)[0] or "application/octet-stream"
    async def iterator():
        while chunk := await stream.readchunk():
            yield chunk
    return StreamingResponse(iterator(), media_type=content_type, headers={"Content-Disposition": f'inline; filename="{stream.filename.rsplit("/", 1)[-1]}"'})
