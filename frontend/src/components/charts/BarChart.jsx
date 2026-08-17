import { useEffect, useRef, useState } from "react";

/**
 * Gráfico de barras simples em canvas, com tooltip ao passar o mouse.
 * `data` = [{ label, value }]. `formatValue` formata o número no tooltip.
 */
/** Cor vinda dos tokens do tema (claro/escuro), com valor de segurança. */
const token = (name, fallback) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

export const BarChart = ({ data = [], color = "#ff7a18", trackColor = "", labelColor = "", formatValue = (v) => String(v) }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rectsRef = useRef([]);
  const [tooltip, setTooltip] = useState(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const pad = { l: 8, r: 8, t: 10, b: 22 };
    const w = rect.width - pad.l - pad.r;
    const h = rect.height - pad.t - pad.b;
    const max = Math.max(1, ...data.map((d) => d.value));
    const slot = w / Math.max(1, data.length);
    const barWidth = Math.min(42, slot * 0.55);
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const rects = [];
    data.forEach((item, index) => {
      const barHeight = Math.max(3, (item.value / max) * h);
      const x = pad.l + index * slot + (slot - barWidth) / 2;
      const y = pad.t + h - barHeight;
      const radius = Math.min(9, barWidth / 2);
      ctx.fillStyle = trackColor || token("--card-soft", "#f3ede7");
      roundRect(ctx, x, pad.t, barWidth, h, radius);
      ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, x, y, barWidth, barHeight, radius);
      ctx.fill();
      ctx.fillStyle = labelColor || token("--muted", "#7e7e7e");
      ctx.fillText(item.label, x + barWidth / 2, rect.height - 6);
      rects.push({ x, y, w: barWidth, h: barHeight, item });
    });
    rectsRef.current = rects;
  };

  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    if (canvasRef.current) observer.observe(canvasRef.current);
    // Redesenha quando o painel troca entre tema claro e escuro.
    const themeObserver = new MutationObserver(draw);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { observer.disconnect(); themeObserver.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, color, trackColor, labelColor]);

  const onMove = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const hit = rectsRef.current.find((r) => mx >= r.x && mx <= r.x + r.w && my >= r.y - 16 && my <= r.y + r.h);
    if (!hit) { setTooltip(null); return; }
    setTooltip({ x: hit.x + hit.w / 2, y: hit.y, label: hit.item.label, value: hit.item.value });
  };

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} onMouseMove={onMove} onMouseLeave={() => setTooltip(null)} />
      {tooltip && (
        <div className={`chart-tooltip show`} style={{ left: tooltip.x, top: tooltip.y }}>
          <span><i className="dot" />{tooltip.label}</span>
          <strong>{formatValue(tooltip.value)}</strong>
        </div>
      )}
    </div>
  );
};

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export default BarChart;
