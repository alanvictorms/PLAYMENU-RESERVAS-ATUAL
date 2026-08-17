import { useCallback, useEffect, useRef, useState } from "react";

const MAX_ZOOM = 3;

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Imagem inválida."));
    image.src = src;
  });

const renameFile = (name, extension) =>
  `${String(name || "imagem").replace(/\.[^./\\]+$/, "")}.${extension}`;

/**
 * Área de upload com prévia e recorte: o usuário arrasta a imagem dentro da
 * moldura e usa o zoom para escolher exatamente o enquadramento desejado.
 */
export default function ImageCropField({
  id,
  name,
  aspect = 1,
  outputWidth = 800,
  maxSizeMb = 5,
  rounded = false,
  hint,
  currentImage = null,
  file = null,
  onChange,
  onError,
}) {
  const [source, setSource] = useState(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);

  const frameRef = useRef(null);
  const inputRef = useRef(null);
  const dragState = useRef(null);
  const fileNameRef = useRef("imagem.png");

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const frameSize = useCallback(() => {
    const width = frameRef.current?.clientWidth || 0;
    return { width, height: width / aspect };
  }, [aspect]);

  // Escala mínima que ainda cobre toda a moldura (evita bordas vazias).
  const baseScale = useCallback(() => {
    const { width, height } = frameSize();
    if (!natural.width || !natural.height || !width) return 1;
    return Math.max(width / natural.width, height / natural.height);
  }, [natural, frameSize]);

  const clampOffset = useCallback(
    (next, scale) => {
      const { width, height } = frameSize();
      const limitX = Math.max(0, (natural.width * scale - width) / 2);
      const limitY = Math.max(0, (natural.height * scale - height) / 2);

      return {
        x: Math.min(limitX, Math.max(-limitX, next.x)),
        y: Math.min(limitY, Math.max(-limitY, next.y)),
      };
    },
    [natural, frameSize],
  );

  useEffect(() => {
    setOffset((current) => clampOffset(current, baseScale() * zoom));
  }, [zoom, clampOffset, baseScale]);

  const pickFile = async (selected) => {
    if (!selected) return;

    if (!/^image\//.test(selected.type)) {
      onError?.("Selecione um arquivo de imagem.");
      return;
    }

    if (selected.size > maxSizeMb * 1024 * 1024) {
      onError?.(`O arquivo deve ter no máximo ${maxSizeMb} MB.`);
      return;
    }

    try {
      const dataUrl = await readFile(selected);
      const image = await loadImage(dataUrl);

      fileNameRef.current = selected.name;
      setSource(dataUrl);
      setNatural({ width: image.naturalWidth, height: image.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setEditing(true);
      onError?.("");
    } catch (err) {
      onError?.(err.message);
    }
  };

  const startDrag = (event) => {
    if (!editing) return;

    event.preventDefault();

    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Alguns navegadores recusam a captura; o arraste segue funcionando.
    }

    dragState.current = { x: event.clientX, y: event.clientY, offset };
    setDragging(true);
  };

  const moveDrag = (event) => {
    if (!dragState.current) return;

    const scale = baseScale() * zoom;
    setOffset(
      clampOffset(
        {
          x: dragState.current.offset.x + (event.clientX - dragState.current.x),
          y: dragState.current.offset.y + (event.clientY - dragState.current.y),
        },
        scale,
      ),
    );
  };

  const endDrag = () => {
    dragState.current = null;
    setDragging(false);
  };

  const applyCrop = async () => {
    const { width, height } = frameSize();
    if (!source || !width) return;

    const image = await loadImage(source);
    const scale = baseScale() * zoom;

    // Canto superior esquerdo da imagem exibida, em coordenadas da moldura.
    const displayLeft = width / 2 + offset.x - (natural.width * scale) / 2;
    const displayTop = height / 2 + offset.y - (natural.height * scale) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = Math.round(outputWidth / aspect);

    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      -displayLeft / scale,
      -displayTop / scale,
      width / scale,
      height / scale,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const isPng = /\.png$/i.test(fileNameRef.current);
    const type = isPng ? "image/png" : "image/jpeg";

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onError?.("Não foi possível recortar a imagem.");
          return;
        }

        const cropped = new File(
          [blob],
          renameFile(fileNameRef.current, isPng ? "png" : "jpg"),
          { type },
        );

        onChange?.(cropped);
        setEditing(false);
      },
      type,
      0.92,
    );
  };

  const reset = () => {
    setEditing(false);
    setSource(null);
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const scale = baseScale() * zoom;
  const showPreview = Boolean(preview || currentImage) && !editing;

  return (
    <div className="ui-crop-field">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="ui-visually-hidden"
        onChange={(event) => pickFile(event.target.files?.[0])}
      />

      {!editing && !showPreview && (
        <label
          htmlFor={id}
          className={`ui-upload-zone${dragging ? " is-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            pickFile(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="ui-upload-zone__icon">
            <i className="fas fa-cloud-arrow-up" aria-hidden="true" />
          </span>

          <strong>Selecione ou arraste sua imagem</strong>
          <span>{hint || `PNG, JPG ou WebP de até ${maxSizeMb} MB.`}</span>
        </label>
      )}

      {editing && (
        <div className="ui-cropper">
          <div
            ref={frameRef}
            className={`ui-cropper__frame${rounded ? " is-round" : ""}${dragging ? " is-dragging" : ""}`}
            style={{ aspectRatio: String(aspect) }}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <img
              src={source}
              alt="Prévia para recorte"
              draggable="false"
              style={{
                width: natural.width * scale,
                height: natural.height * scale,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
            <span className="ui-cropper__grid" aria-hidden="true" />
          </div>

          <label className="ui-cropper__zoom">
            <i className="fas fa-magnifying-glass-minus" aria-hidden="true" />
            <input
              type="range"
              min="1"
              max={MAX_ZOOM}
              step="0.01"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              aria-label="Zoom da imagem"
            />
            <i className="fas fa-magnifying-glass-plus" aria-hidden="true" />
          </label>

          <p className="ui-cropper__help">
            Arraste a imagem para posicionar e use o zoom para enquadrar.
          </p>

          <div className="ui-cropper__actions">
            <button type="button" className="ui-btn ui-btn--outline ui-btn--sm" onClick={reset}>
              Cancelar
            </button>

            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={applyCrop}>
              Aplicar recorte
            </button>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="ui-crop-preview">
          <div
            className={`ui-crop-preview__image${rounded ? " is-round" : ""}`}
            style={{ aspectRatio: String(aspect) }}
          >
            <img src={preview || currentImage} alt="Prévia" />
          </div>

          <div className="ui-crop-preview__actions">
            {source && (
              <button
                type="button"
                className="ui-btn ui-btn--outline ui-btn--sm"
                onClick={() => setEditing(true)}
              >
                Ajustar recorte
              </button>
            )}

            <button
              type="button"
              className="ui-btn ui-btn--ghost ui-btn--sm"
              onClick={() => inputRef.current?.click()}
            >
              Trocar imagem
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
