import mimetypes
from email.utils import formatdate
from inspect import isawaitable

from bson import ObjectId
from fastapi import HTTPException, Request, UploadFile
from starlette.responses import Response, StreamingResponse

from app_core import files, new_file_name
from video_service import faststart

ALLOWED = {
    "thumbs": ({"png", "jpg", "jpeg", "webp"}, 5 * 1024 * 1024),
    "branding": ({"png", "jpg", "jpeg", "webp"}, 5 * 1024 * 1024),
    "videos": ({"mp4", "mov", "m4v", "webm"}, 120 * 1024 * 1024),
    "models3d": ({"glb", "gltf"}, 50 * 1024 * 1024),
    "materials": ({"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "webm", "mkv", "avi", "zip"}, 300 * 1024 * 1024),
    "bio": ({"png", "jpg", "jpeg", "webp", "gif", "pdf"}, 5 * 1024 * 1024),
    "qr_templates": ({"png", "jpg", "jpeg", "webp"}, 15 * 1024 * 1024),
}

# Arquivos no GridFS nunca são reescritos (cada upload gera um novo ObjectId),
# então o conteúdo de uma URL é imutável e pode ser cacheado por um ano.
CACHE_CONTROL = "public, max-age=31536000, immutable"
READ_CHUNK = 512 * 1024

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
    if extension in {"mp4", "m4v", "mov"}:
        # Garante que o índice do vídeo venha antes dos dados: o player começa a
        # tocar com os primeiros KB em vez de esperar o arquivo inteiro.
        content = faststart(content)
    stored_name = new_file_name(upload.filename, folder)
    file_id = await files.upload_from_stream(stored_name, content, metadata={"content_type": upload.content_type, "original_name": upload.filename})
    return {"path": f"/api/files/{file_id}", "stored_name": stored_name, "size": len(content), "original_name": upload.filename}

async def _resolve(value):
    """Motor expõe alguns métodos do GridOut como síncronos e outros como futures."""
    return await value if isawaitable(value) else value

def parse_range(header: str | None, size: int):
    """Interpreta um cabeçalho Range de faixa única. Retorna (início, fim) inclusivo,
    None quando não há Range e False quando a faixa é inválida (416)."""
    if not header:
        return None
    header = header.strip()
    if not header.startswith("bytes=") or "," in header:
        return False
    start_text, separator, end_text = header[6:].strip().partition("-")
    if not separator:
        return False
    try:
        if not start_text:
            length = int(end_text)
            if length <= 0:
                return False
            start, end = max(0, size - length), size - 1
        else:
            start = int(start_text)
            end = int(end_text) if end_text else size - 1
    except ValueError:
        return False
    end = min(end, size - 1)
    if start > end or start >= size:
        return False
    return start, end

async def _body(stream, start: int, remaining: int):
    try:
        if start:
            await _resolve(stream.seek(start))
        while remaining > 0:
            chunk = await _resolve(stream.read(min(READ_CHUNK, remaining)))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk
    finally:
        await _resolve(stream.close())

async def stream_file(file_id: str, request: Request | None = None):
    """Entrega um arquivo do GridFS com suporte a Range (seek/streaming de vídeo),
    cache de longa duração e revalidação por ETag."""
    try:
        object_id = ObjectId(file_id)
    except Exception as exc:
        raise HTTPException(404, "Arquivo não encontrado.") from exc
    try:
        stream = await files.open_download_stream(object_id)
    except Exception as exc:
        raise HTTPException(404, "Arquivo não encontrado.") from exc

    size = int(stream.length or 0)
    name = (stream.filename or file_id).rsplit("/", 1)[-1]
    content_type = (stream.metadata or {}).get("content_type") or mimetypes.guess_type(name)[0] or "application/octet-stream"
    etag = f'"{file_id}"'
    headers = {
        "Accept-Ranges": "bytes",
        "Cache-Control": CACHE_CONTROL,
        "ETag": etag,
        "Content-Disposition": f'inline; filename="{name}"',
    }
    if stream.upload_date:
        headers["Last-Modified"] = formatdate(stream.upload_date.timestamp(), usegmt=True)

    if request is not None and etag in [value.strip() for value in (request.headers.get("if-none-match") or "").split(",")]:
        await _resolve(stream.close())
        return Response(status_code=304, headers=headers)

    span = parse_range(request.headers.get("range") if request is not None else None, size)
    if span is False:
        await _resolve(stream.close())
        return Response(status_code=416, headers={**headers, "Content-Range": f"bytes */{size}"})

    start, end = span or (0, size - 1)
    length = max(0, end - start + 1)
    status = 206 if span else 200
    headers["Content-Length"] = str(length)
    if span:
        headers["Content-Range"] = f"bytes {start}-{end}/{size}"

    if request is not None and request.method == "HEAD":
        await _resolve(stream.close())
        return Response(status_code=status, headers=headers, media_type=content_type)

    return StreamingResponse(_body(stream, start, length), status_code=status, media_type=content_type, headers=headers)
