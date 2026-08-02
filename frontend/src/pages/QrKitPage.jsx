import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Link } from "react-router-dom";
import { PageContent, PageHeader } from "../components/RestaurantLayout";
import { api, mediaUrl } from "../services/api";

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const wrapText = (context, text, x, y, maxWidth, lineHeight, maxLines = 3) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const candidate = `${line} ${word}`.trim();
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
};

const drawBuiltin = (context, template, restaurantName) => {
  const { width, height, background_color: background, accent_color: accent, builtin_theme: theme } = template;
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, background || "#201827");
  gradient.addColorStop(1, "#0d0911");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = accent || "#f4581c";
  context.beginPath();
  context.arc(width * .9, height * .08, Math.min(width, height) * .28, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = .14;
  context.beginPath();
  context.arc(width * .05, height * .92, Math.min(width, height) * .34, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  const leftAligned = theme === "napkin";
  const textX = leftAligned ? 110 : width / 2;
  const titleY = leftAligned ? height * .42 : height * .34;
  context.textAlign = leftAligned ? "left" : "center";
  context.fillStyle = "#ffffff";
  context.font = `800 ${Math.round(Math.min(width, height) * .065)}px Inter, Arial, sans-serif`;
  wrapText(context, "Aponte a câmera e veja nosso cardápio", textX, titleY, leftAligned ? width * .42 : width * .78, Math.min(width, height) * .075, 3);
  context.fillStyle = "rgba(255,255,255,.72)";
  context.font = `600 ${Math.round(Math.min(width, height) * .026)}px Inter, Arial, sans-serif`;
  context.fillText(restaurantName, textX, leftAligned ? height * .74 : height * .91);
};

const drawCoverImage = (context, image, width, height, x = 0, y = 0) => {
  const scale = Math.max(width / image.width, height / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;
  context.drawImage(image, x + (width - drawnWidth) / 2, y + (height - drawnHeight) / 2, drawnWidth, drawnHeight);
};

export default function QrKitPage() {
  const canvasRef = useRef(null);
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/restaurant/qr-kit").then((response) => {
      setData(response.data);
      setSelectedId(response.data.templates?.[0]?.id || null);
    }).catch((requestError) => setError(requestError.response?.data?.detail || "Não foi possível carregar os modelos."));
  }, []);

  const selected = useMemo(() => data?.templates?.find((template) => template.id === selectedId), [data, selectedId]);
  const menuUrl = data ? `${window.location.origin}${data.menu_path}` : "";

  useEffect(() => {
    if (!selected || !data || !canvasRef.current) return undefined;
    let cancelled = false;
    const render = async () => {
      setRendering(true);
      setError("");
      try {
        const canvas = canvasRef.current;
        canvas.width = selected.width;
        canvas.height = selected.height;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (selected.template_file) {
          const background = await loadImage(mediaUrl(selected.template_file));
          drawCoverImage(context, background, canvas.width, canvas.height);
        } else {
          drawBuiltin(context, selected, data.restaurant.name);
        }

        const qrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(qrCanvas, menuUrl, {
          errorCorrectionLevel: "H",
          margin: 2,
          width: selected.qr_size,
          color: { dark: "#121014", light: "#ffffff" },
        });
        context.save();
        context.fillStyle = "#ffffff";
        context.shadowColor = "rgba(0,0,0,.28)";
        context.shadowBlur = Math.round(selected.qr_size * .06);
        context.fillRect(selected.qr_x, selected.qr_y, selected.qr_size, selected.qr_size);
        context.shadowBlur = 0;
        context.drawImage(qrCanvas, selected.qr_x, selected.qr_y, selected.qr_size, selected.qr_size);
        context.restore();

        if (data.restaurant.logo_image) {
          const logo = await loadImage(mediaUrl(data.restaurant.logo_image));
          const size = selected.logo_size;
          const centerX = selected.logo_x + size / 2;
          const centerY = selected.logo_y + size / 2;
          context.save();
          context.fillStyle = "#ffffff";
          context.beginPath();
          context.arc(centerX, centerY, size / 2 + Math.max(8, size * .04), 0, Math.PI * 2);
          context.fill();
          context.beginPath();
          context.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
          context.clip();
          drawCoverImage(context, logo, size, size, selected.logo_x, selected.logo_y);
          context.restore();
        }
        if (!cancelled) setRendering(false);
      } catch {
        if (!cancelled) {
          setError("Não foi possível montar a prévia. Confira o arquivo do modelo e o logo do restaurante.");
          setRendering(false);
        }
      }
    };
    render();
    return () => { cancelled = true; };
  }, [selected, data, menuUrl]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selected) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(blob);
      anchor.download = `${selected.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${data.restaurant.slug}.png`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
    }, "image/png", 1);
  };

  return <>
    <PageHeader title="Materiais com QR Code" description="Gere artes prontas para impressão com o link do cardápio e a identidade do restaurante." section="Divulgação" />
    <PageContent>
      {error && <div className="ui-alert ui-alert--danger" role="alert"><i className="fas fa-circle-exclamation" /><div><strong>Não foi possível gerar a arte</strong><p>{error}</p></div></div>}
      {!data ? <div className="loading-inline">Carregando modelos...</div> : <div className="ui-qr-kit-layout">
        <aside className="ui-surface">
          <span className="ui-eyebrow">Formatos disponíveis</span>
          <h2>Escolha uma peça</h2>
          <div className="ui-qr-template-list">
            {data.templates.map((template) => <button key={template.id} className={template.id === selectedId ? "is-selected" : ""} onClick={() => setSelectedId(template.id)}>
              <span className="ui-qr-template-list__icon"><i className="fas fa-qrcode" /></span>
              <span><strong>{template.name}</strong><small>{template.description}<br />{template.width} × {template.height}px</small></span>
              <i className="fas fa-chevron-right" />
            </button>)}
          </div>
          <div className="ui-qr-url"><span>Link inserido no QR Code</span><strong>{menuUrl}</strong></div>
          {!data.restaurant.logo_image && <div className="ui-alert ui-alert--warning"><i className="fas fa-image" /><div><strong>Logo não cadastrado</strong><p><Link to="/admin/configuracoes">Adicione o logo nas configurações</Link> para completar a arte.</p></div></div>}
        </aside>
        <section className="ui-surface ui-qr-preview">
          <div className="ui-section-heading">
            <div><span className="ui-eyebrow">Prévia em alta resolução</span><h2>{selected?.name}</h2></div>
            <button className="ui-btn ui-btn--primary" onClick={download} disabled={rendering || !selected}>
              <i className="fas fa-download" /> {rendering ? "Gerando..." : "Baixar PNG"}
            </button>
          </div>
          <div className="ui-qr-canvas-shell"><canvas ref={canvasRef} aria-label={`Prévia de ${selected?.name || "arte com QR Code"}`} /></div>
          <p className="ui-helper-text"><i className="fas fa-circle-info" /> O arquivo baixado mantém o tamanho original configurado pelo administrador.</p>
        </section>
      </div>}
    </PageContent>
  </>;
}
