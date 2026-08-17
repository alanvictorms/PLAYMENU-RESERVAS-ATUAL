import { useEffect, useRef } from "react";

/**
 * Gauge em semicírculo desenhado em canvas. `value` é 0-100.
 * A trilha inteira fica na cor clara e o arco proporcional ao valor
 * é desenhado por cima em laranja, com pontas arredondadas.
 */
export const GaugeChart = ({ value = 0, label, sublabel, trackColor = "", fillColor = "#ff7a18" }) => {
  const canvasRef = useRef(null);
  const pct = Math.max(0, Math.min(100, value));

  useEffect(() => {
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
      const cx = rect.width / 2;
      const cy = rect.height * 0.92;
      const radius = Math.min(rect.width * 0.42, rect.height * 0.82);
      const lineWidth = Math.max(10, radius * 0.16);
      ctx.lineCap = "round";
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = trackColor || getComputedStyle(document.documentElement).getPropertyValue("--orange-pale").trim() || "#ffe1c7";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = fillColor;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI, Math.PI + Math.PI * (pct / 100));
      ctx.stroke();
    };
    draw();
    const observer = new ResizeObserver(draw);
    if (canvasRef.current) observer.observe(canvasRef.current);
    const themeObserver = new MutationObserver(draw);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { observer.disconnect(); themeObserver.disconnect(); };
  }, [pct, trackColor, fillColor]);

  return (
    <div className="gauge-wrap">
      <canvas ref={canvasRef} />
      <div className="gauge-copy">
        <strong>{label}</strong>
        <span>{sublabel}</span>
      </div>
    </div>
  );
};

export default GaugeChart;
