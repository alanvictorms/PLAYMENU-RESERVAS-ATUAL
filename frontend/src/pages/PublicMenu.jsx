import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api, mediaUrl, money } from "../services/api";
import ReservationModal from "../components/ReservationModal";

/* ═══════════════════════════════════════════════════════════════════════
   PLAYMENU · Cardápio público (design system "Brasa")
   – 100% responsivo (mobile first, safe-area, dvh)
   – Feed em vídeo full screen + folha de detalhes que sobe SEM trocar de página
   – Minha lista (comanda local) com botão flutuante fixo
   – Modal de perfil do restaurante (capa + avatar + redes + endereço)
   – Rodapé Playmenu em todos os restaurantes
   Toda a integração de API, analytics, avaliações, busca, categorias,
   estabelecimentos, promoções, tamanhos, opcionais, alérgenos e AR foi mantida.
══════════════════════════════════════════════════════════════════════ */

const PLAYMENU_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="72.5739mm" height="13.7641mm" version="1.1" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" viewBox="0 0 3336.94 632.87" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xodm="http://www.corel.com/coreldraw/odm/2003">
 <defs>
  
 </defs>
 <g id="Camada_x0020_1" fill="#F7F2ED">
  <metadata id="CorelCorpID_0Corel-Layer"></metadata>
  <path class="fil0" d="M87.5 45.76l238.02 -44.48c32.29,-6.03 59.02,9.47 59.02,41.93l0 27.77 -304.5 0 322.73 33.18c43.78,4.5 80.03,36.02 80.03,80.03l0 289.54c0,0.69 -0.01,1.37 -0.03,2.06 -0.01,0.69 -0.04,1.36 -0.08,2.04l-0 0c-0.03,0.68 -0.07,1.36 -0.12,2.03 -0.05,0.67 -0.11,1.35 -0.18,2.02 -0.07,0.67 -0.15,1.34 -0.23,2 -0.09,0.66 -0.18,1.33 -0.29,1.99 -0.1,0.66 -0.21,1.32 -0.33,1.97 -0.12,0.66 -0.24,1.31 -0.38,1.96 -0.13,0.65 -0.28,1.3 -0.43,1.94 -0.15,0.65 -0.31,1.29 -0.47,1.93 -0.16,0.63 -0.34,1.27 -0.51,1.9 -0.18,0.63 -0.37,1.26 -0.57,1.88l0 0c-0.19,0.63 -0.4,1.25 -0.61,1.87 -0.42,1.24 -0.87,2.46 -1.35,3.67 -0.24,0.61 -0.48,1.2 -0.74,1.8l-0 0c-0.25,0.6 -0.51,1.19 -0.78,1.78 -0.27,0.59 -0.54,1.18 -0.82,1.76l-0.87 1.73c-0.29,0.57 -0.59,1.15 -0.91,1.72l0 0c-0.3,0.57 -0.63,1.12 -0.94,1.68 -0.65,1.12 -1.32,2.22 -2.01,3.3l0 0c-0.34,0.54 -0.7,1.07 -1.07,1.61 -0.35,0.53 -0.72,1.06 -1.09,1.58 -0.38,0.52 -0.75,1.05 -1.14,1.56 -0.38,0.51 -0.77,1.03 -1.17,1.53 -0.4,0.5 -0.8,1 -1.21,1.49l0 0c-0.4,0.5 -0.82,0.98 -1.24,1.47 -0.42,0.48 -0.84,0.96 -1.27,1.43 -0.43,0.47 -0.87,0.95 -1.31,1.41l-0 0c-0.44,0.46 -0.89,0.92 -1.34,1.37 -0.46,0.46 -0.91,0.91 -1.37,1.35 -0.46,0.45 -0.94,0.88 -1.41,1.31 -0.47,0.43 -0.96,0.86 -1.44,1.28 -0.49,0.42 -0.97,0.83 -1.47,1.24 -0.49,0.41 -0.99,0.81 -1.49,1.21 -0.51,0.4 -1.02,0.79 -1.53,1.17l-1.55 1.14 -1.58 1.1c-0.53,0.36 -1.07,0.72 -1.61,1.07l-0 0c-1.09,0.69 -2.18,1.37 -3.3,2.01 -0.56,0.32 -1.12,0.64 -1.68,0.94l-0 0 -1.71 0.91 0 0c-0.57,0.29 -1.15,0.58 -1.73,0.86 -0.58,0.28 -1.17,0.56 -1.77,0.83 -0.59,0.27 -1.18,0.53 -1.78,0.78 -0.6,0.25 -1.2,0.5 -1.8,0.74 -1.21,0.48 -2.43,0.93 -3.67,1.35 -0.62,0.22 -1.24,0.41 -1.87,0.61l-0 0 -1.89 0.57c-0.63,0.18 -1.27,0.35 -1.9,0.51 -0.64,0.17 -1.28,0.33 -1.93,0.48 -0.64,0.15 -1.29,0.29 -1.94,0.43 -0.65,0.13 -1.3,0.26 -1.95,0.37 -0.66,0.12 -1.31,0.23 -1.97,0.33 -0.66,0.1 -1.32,0.2 -1.99,0.29 -0.67,0.08 -1.33,0.16 -2,0.23 -0.67,0.07 -1.35,0.13 -2.02,0.18 -0.67,0.06 -1.35,0.1 -2.03,0.13l0 0c-0.68,0.03 -1.36,0.06 -2.05,0.08 -0.69,0.01 -1.37,0.03 -2.06,0.03l-322.73 0c-44.02,0 -80.03,-36.02 -80.03,-80.03l0 -322.73c0,-0.69 0.01,-1.37 0.03,-2.06l0 -0c0.01,-0.69 0.04,-1.36 0.08,-2.04l0 -0.01c0.03,-0.67 0.07,-1.35 0.12,-2.02l0 -0.03c0.06,-0.67 0.11,-1.33 0.18,-1.99 4.12,-40.22 38.35,-71.88 79.61,-71.88l-4.29 0c-11.67,0 -22.77,2.53 -32.8,7.07 10.87,-16.21 26.88,-28.99 44.56,-32.29zm61.37 136.57c-19.52,6 -21.74,15.65 -21.73,39.64l-0.23 184.41c-0.03,20.12 5.03,35.11 23.88,36.66 19.91,1.63 99.11,-52.95 118.96,-64.55l76.37 -46.49c13.18,-11.77 13.41,-31.52 -1.72,-42.76l-115.01 -69.25c-15.93,-9.42 -61.43,-43.52 -80.52,-37.67z"></path>
  <path class="fil1" d="M1030.9 237c0.51,-70.62 -37.63,-105.16 -129.89,-105.16l-193.3 0 0 372.68 46.39 0 0 -162.37 119.07 0c110.82,0 157.21,-38.14 157.73,-105.15zm-48.97 0c0,60.82 -63.92,62.88 -94.84,62.88l-132.99 0 0 -126.28 132.99 0c53.09,0 94.84,3.09 94.84,63.4z"></path>
  <polygon id="_1" class="fil1" points="1122.85,504.52 1122.85,131.85 1075.95,131.85 1075.95,504.52 "></polygon>
  <path id="_2" class="fil1" d="M1446.77 504.52l0 -183.5c0,-77.32 -67.53,-85.57 -121.13,-85.57 -87.11,0 -141.75,31.96 -141.75,102.58l46.39 0c0,-29.38 3.61,-66.49 95.36,-66.49 48.97,0 78.86,12.37 78.86,42.78 0,30.41 -63.92,34.54 -84.02,36.09 -104.64,7.21 -150,19.07 -150,78.35 0,56.18 53.09,82.98 126.8,82.98 50.51,0 93.81,-20.1 107.22,-41.75l0 34.54 42.27 0zm-42.27 -127.32c0,61.34 -31.96,98.45 -107.22,98.45 -53.61,0 -80.41,-11.85 -80.41,-46.9 0,-64.44 127.32,-25.26 187.63,-64.44l0 12.89z"></path>
  <polygon id="_3" class="fil1" points="1802.12,243.7 1751.09,243.7 1640.27,454.53 1528.92,243.7 1477.9,243.7 1615.01,503.49 1548.51,632.87 1600.06,632.87 "></polygon>
  <path id="_4" class="fil1" d="M2315.72 504.52l0 -149.48c0,-62.37 -29.38,-118.56 -132.47,-119.59 -84.53,-0.51 -104.64,50.51 -104.64,50.51 -13.92,-27.83 -50.51,-50.51 -113.92,-50.51 -63.4,0 -85.57,36.6 -85.57,36.6l0 -28.35 -46.9 0 0 260.82 46.9 0 0 -149.48c0,-61.86 31.96,-83.5 85.57,-83.5 53.61,0 86.08,21.65 86.08,83.5l0 149.48 46.39 0 0 -149.48c0,-61.86 32.47,-83.5 86.08,-83.5 53.61,0 86.08,21.65 86.08,83.5l0 149.48 46.39 0z"></path>
  <path id="_5" class="fil1" d="M2660.77 410.2l-51.03 0c0,35.05 -30.41,66.49 -100,66.49 -69.59,0 -104.12,-39.17 -104.12,-97.94l255.15 0c0,-79.89 -39.17,-143.3 -151.03,-143.3 -80.92,0 -150.52,45.36 -150.52,138.66 0,93.3 69.59,138.66 150.52,138.66 126.29,0 151.03,-89.17 151.03,-102.58zm-48.45 -62.89l-204.64 0c0,-38.66 32.48,-75.77 102.06,-75.77 70.1,0 102.58,37.11 102.58,75.77z"></path>
  <path id="_6" class="fil1" d="M3002.2 504.52l0 -162.37c0,-59.28 -23.2,-106.7 -139.18,-106.7 -70.1,0 -104.12,38.14 -104.12,38.14l0 -29.9 -46.9 0 0 260.82 46.9 0 0 -127.32c0,-83.5 50,-105.67 104.12,-105.67 80.41,0 92.78,43.29 92.78,105.67l0 127.32 46.39 0z"></path>
  <path id="_7" class="fil1" d="M3336.94 505.04l0 -261.34 -46.91 0 0 146.39c0,69.07 -46.39,86.59 -93.3,86.59 -46.39,0 -92.78,-17.52 -92.78,-86.59l0 -146.39 -46.9 0 0 146.39c0,105.67 62.88,122.68 139.69,122.68 60.83,0 95.88,-39.17 95.88,-39.17l0 31.44 44.33 0z"></path>
 </g>
</svg>`;

const C = {
  base: "#0B0908",
  elev: "#120E0C",
  card: "#141010",
  card2: "#171210",
  brasa: "#FF6A28",
  brasaSoft: "#FF9C6B",
  brasaPale: "#FFC6A5",
  carvao: "#C93F12",
  dourado: "#F0B24A",
  verde: "#5FD08A",
  creme: "#F7F2ED",
  muted: "rgba(247,242,237,.6)",
  faint: "rgba(247,242,237,.38)",
  border: "rgba(255,236,222,.11)",
};
const F = {
  head: "'Space Grotesk',system-ui,sans-serif",
  body: "'Schibsted Grotesk',system-ui,sans-serif",
};
const MAXW = 560;
const FEED_LIMIT = 9; // máximo de produtos por categoria no feed

/* força "Apenas primeira letra maiúscula" (não confundir com text-transform:capitalize) */
const sentenceCase = (text) => {
  if (!text) return text;
  const lower = String(text).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};
/* força "Todas as Iniciais Maiúsculas" (title case) */
const titleCase = (text) => {
  if (!text) return text;
  return String(text)
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
};
const STORY_MS = 30000; // duração de cada prato no autoplay (stories)
const HAND_TAP = "data:image/png;base64,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";

const allergenIcons = {
  gluten: "🌾",
  dairy: "🥛",
  eggs: "🥚",
  soy: "🫘",
  nuts: "🥜",
  shellfish: "🦐",
  fish: "🐟",
  celery: "🥬",
  mustard: "🟡",
  sesame: "⚫",
};

const priceOf = (item) =>
  item?.has_active_promotion && item?.promotion_price_cents != null
    ? item.promotion_price_cents
    : item?.price_cents || 0;

/* ─── ícones ────────────────────────────────────────────────────────── */
const IconPlay = ({ size = 14, color = "#F7F2ED" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <polygon points="6,3 21,12 6,21" fill={color} />
  </svg>
);
const IconClose = ({ size = 14, color = "#F7F2ED" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <line x1="4" y1="4" x2="20" y2="20" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    <line x1="20" y1="4" x2="4" y2="20" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);
const IconSearch = ({ size = 16, color = "rgba(247,242,237,.5)" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <circle cx="10" cy="10" r="6.5" stroke={color} fill="none" strokeWidth="2" />
    <line x1="15" y1="15" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconHeart = ({ filled, size = 19 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
    <path
      d="M50 88 C50 88 12 62 12 38 C12 24 23 14 35 14 C43 14 48 19 50 23 C52 19 57 14 65 14 C77 14 88 24 88 38 C88 62 50 88 50 88 Z"
      fill={filled ? C.brasa : "none"}
      stroke={filled ? C.brasa : C.creme}
      strokeWidth="7"
      strokeLinejoin="round"
    />
  </svg>
);
const IconMuted = ({ size = 19 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
    <path d="M12 38 H28 L50 20 V80 L28 62 H12 Z" fill={C.creme} />
    <path d="M64 38 L88 62 M88 38 L64 62" stroke={C.creme} strokeWidth="7" strokeLinecap="round" fill="none" />
  </svg>
);
const IconSound = ({ size = 19 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
    <path d="M12 38 H28 L50 20 V80 L28 62 H12 Z" fill={C.creme} />
    <path d="M62 34 C72 42 72 58 62 66 M76 24 C92 38 92 62 76 76" stroke={C.creme} strokeWidth="7" strokeLinecap="round" fill="none" />
  </svg>
);
const IconComanda = ({ size = 24, color = "#F7F2ED" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101 101" width={size} height={size} aria-hidden="true">
    <path d="M75,17.22v0a1.51,1.51,0,0,0-.09-.28l-.05-.1a1.5,1.5,0,0,0-.08-.15l0-.06a1.48,1.48,0,0,0-.42-.38l-.21-.11h0l-33-13.5A1.5,1.5,0,0,0,39,4V16H27.5A1.5,1.5,0,0,0,26,17.5v75A1.5,1.5,0,0,0,27.5,94h46A1.5,1.5,0,0,0,75,92.5v-75h0A1.49,1.49,0,0,0,75,17.22Zm-33-11L65.87,16H42ZM72,91H29V19H72Z" fill={color} />
    <path d="M38.92,34.5A11.76,11.76,0,0,0,49,46.12V53H44a1.5,1.5,0,0,0,0,3H57a1.5,1.5,0,0,0,0-3H52V46.17A11.76,11.76,0,0,0,62.42,34.5a1.5,1.5,0,0,0-1.5-1.5H40.42A1.5,1.5,0,0,0,38.92,34.5ZM59.3,36a8.75,8.75,0,0,1-17.24,0Z" fill={color} />
    <path d="M36,68.5A1.5,1.5,0,0,0,37.5,70h26a1.5,1.5,0,0,0,0-3h-26A1.5,1.5,0,0,0,36,68.5Z" fill={color} />
    <path d="M57.17,75h-13a1.5,1.5,0,0,0,0,3h13a1.5,1.5,0,0,0,0-3Z" fill={color} />
  </svg>
);
const IconPause = ({ size = 17, color = "#F7F2ED" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1.4" fill={color} />
    <rect x="14" y="4" width="4" height="16" rx="1.4" fill={color} />
  </svg>
);
const Caret = ({ dir = "right", color = C.brasa, size = 5 }) => {
  const base = { width: 0, height: 0, display: "inline-block", flexShrink: 0 };
  const t = `${size * 0.7}px solid transparent`;
  if (dir === "right") return <span style={{ ...base, borderLeft: `${size}px solid ${color}`, borderTop: t, borderBottom: t }} />;
  if (dir === "left") return <span style={{ ...base, borderRight: `${size}px solid ${color}`, borderTop: t, borderBottom: t }} />;
  if (dir === "up") return <span style={{ ...base, borderBottom: `${size}px solid ${color}`, borderLeft: t, borderRight: t }} />;
  return <span style={{ ...base, borderTop: `${size}px solid ${color}`, borderLeft: t, borderRight: t }} />;
};

/* ─── peças reutilizáveis ───────────────────────────────────────────── */
const RoundBtn = ({ onClick, ariaLabel, children, active = false, style = {} }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    style={{
      width: 44,
      height: 44,
      flex: "none",
      borderRadius: 99,
      border: active ? "1px solid rgba(255,255,255,.4)" : "1px solid rgba(255,255,255,.18)",
      background: active ? "rgba(247,242,237,.16)" : "rgba(11,9,8,.45)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      padding: 0,
      ...style,
    }}
  >
    {children}
  </button>
);

const priceParts = (cents) => {
  const value = Math.max(0, Math.round(cents || 0));
  return { int: String(Math.floor(value / 100)), dec: String(value % 100).padStart(2, "0") };
};

/* preço: estilo forçado por classe (!important) para não conflitar com CSS legado */
const Price = ({ item, size = "sm" }) => {
  const promo = item?.has_active_promotion && item?.promotion_price_cents != null;
  const parts = priceParts(priceOf(item));
  return (
    <span className="pmPriceWrap">
      {promo && <span className="pmPrice pmPrice--old">{money(item.price_cents)}</span>}
      <span className={`pmPrice pmPrice--${size}${promo ? " pmPrice--promo" : ""}`}>
        <span className="pmPriceSym">R$</span>
        <span className="pmPriceInt">{parts.int}</span>
        <span className="pmPriceDec">,{parts.dec}</span>
      </span>
    </span>
  );
};

const Divider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", margin: "14px 0 10px" }}>
    <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,rgba(255,106,40,0),rgba(255,106,40,.7))" }} />
    <div style={{ width: 5, height: 5, borderRadius: 99, background: C.brasa, margin: "0 13px", flex: "none" }} />
    <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,rgba(255,106,40,.7),rgba(255,106,40,0))" }} />
  </div>
);

const PlaymenuFooter = ({ compact = false }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, padding: compact ? "18px 16px" : "26px 16px 30px" }}>
    <a
      href="https://playmenu.app"
      target="_blank"
      rel="noreferrer"
      aria-label="Ir para o Playmenu"
      className="pmFooterLogo"
      style={{ display: "block", width: compact ? 106 : 128, opacity: 0.5 }}
      dangerouslySetInnerHTML={{ __html: PLAYMENU_SVG }}
    />
    {!compact && (
      <span style={{ font: `400 9.5px/1 ${F.body}`, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(247,242,237,.26)" }}>
        cardápio em vídeo
      </span>
    )}
  </div>
);

/* ─── card de prato (grade 3 colunas) ───────────────────────────────── */
const ProductTile = ({ item, onOpen, intent }) => {
  const thumb = item.image_url ? mediaUrl(item.image_url) : null;
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      {...intent}
      data-testid={`product-card-${item.id}`}
      style={{ background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", textAlign: "left", minWidth: 0, color: "inherit" }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "3/4",
          borderRadius: 13,
          overflow: "hidden",
          background: "repeating-linear-gradient(135deg,#191310 0 6px,#211a14 6px 12px)",
          border: `1px solid ${C.border}`,
        }}
      >
        {thumb && (
          <img src={thumb} alt={item.title} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(11,9,8,0) 46%,rgba(11,9,8,.62))" }} />
        {item.video_url && (
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              width: 30,
              height: 30,
              borderRadius: 99,
              background: "rgba(11,9,8,.34)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,.24)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconPlay size={11} />
          </span>
        )}
        {item.is_featured && (
          <span style={{ position: "absolute", top: 6, left: 6, width: 20, height: 20, borderRadius: 99, background: "linear-gradient(160deg,#FF8B57,#C93F12)", boxShadow: "0 2px 8px rgba(0,0,0,.5)" }} />
        )}
        {item.has_active_promotion && (
          <span style={{ position: "absolute", top: 6, right: 6, background: C.carvao, color: "#fff", borderRadius: 99, padding: "3px 8px", font: `700 8.5px/1 ${F.body}`, letterSpacing: ".06em" }}>
            {item.promotion?.label || "PROMO"}
          </span>
        )}
      </div>
      <div style={{ padding: "7px 1px 0" }}>
        <div style={{ font: `600 12.5px/1.3 ${F.body}`, height: 32, overflow: "hidden", color: C.creme }}>{item.title}</div>
        <div style={{ marginTop: 3 }}>
          <Price item={item} />
        </div>
      </div>
    </button>
  );
};

/* ─── FEED em vídeo (tela cheia) ────────────────────────────────────── */
const CoachOverlay = ({ onDone }) => (
  <div style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(6,5,4,.86)", backdropFilter: "blur(3px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
    <div style={{ position: "relative", width: "100%", height: "min(240px,28dvh)" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={HAND_TAP} alt="" style={{ width: 92, height: "auto", display: "block", animation: "pmHandV 7s cubic-bezier(.4,0,.3,1) infinite", filter: "drop-shadow(0 10px 26px rgba(0,0,0,.55))" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={HAND_TAP} alt="" style={{ width: 92, height: "auto", display: "block", opacity: 0, animation: "pmHandH 7s cubic-bezier(.4,0,.3,1) infinite", filter: "drop-shadow(0 10px 26px rgba(0,0,0,.55))" }} />
      </div>
    </div>

    <div style={{ position: "relative", width: "100%", height: 100, marginTop: 6 }}>
      <div style={{ position: "absolute", inset: 0, textAlign: "center", animation: "pmLabelV 7s ease infinite" }}>
        <div style={{ font: `600 18px/1.2 ${F.head}`, letterSpacing: "-.01em", color: C.creme }}>Deslize para cima</div>
        <div style={{ font: `400 13.5px/1.4 ${F.body}`, color: "rgba(247,242,237,.6)", marginTop: 7 }}>vai para o próximo prato da categoria</div>
      </div>
      <div style={{ position: "absolute", inset: 0, textAlign: "center", animation: "pmLabelH 7s ease infinite" }}>
        <div style={{ font: `600 18px/1.2 ${F.head}`, letterSpacing: "-.01em", color: C.brasaPale }}>Arraste para o lado</div>
        <div style={{ font: `400 13.5px/1.4 ${F.body}`, color: "rgba(247,242,237,.6)", marginTop: 7 }}>troca a categoria inteira</div>
      </div>
    </div>

    <button
      type="button"
      onClick={onDone}
      style={{ position: "absolute", left: 28, right: 28, bottom: "calc(46px + env(safe-area-inset-bottom))", height: 52, border: "none", borderRadius: 99, background: C.creme, color: C.base, font: `600 14.5px/1 ${F.body}`, cursor: "pointer" }}
    >
      Entendi
    </button>
  </div>
);

const VideoFeed = ({
  items,
  index,
  onIndex,
  catName,
  catIndex,
  catCount,
  onCat,
  onClose,
  onDetail,
  onAdd,
  muted,
  onToggleMute,
  listCount,
  onOpenList,
  coach,
  onCoachDone,
  paused,
}) => {
  const drag = useRef(null);
  const wheelAt = useRef(0);
  const catRef = useRef(catIndex);
  const barRef = useRef(null);
  const progRef = useRef(0);
  const [playing, setPlaying] = useState(true);
  const [flash, setFlash] = useState(null);
  const total = items.length;
  const cur = items[Math.min(index, total - 1)];

  const step = useCallback(
    (d) => {
      if (!total) return;
      onIndex((index + d + total) % total);
    },
    [index, total, onIndex],
  );

  /* flash com o nome da categoria a cada troca lateral */
  useEffect(() => {
    if (catRef.current === catIndex) return undefined;
    catRef.current = catIndex;
    setFlash(catName);
    const timer = setTimeout(() => setFlash(null), 1500);
    return () => clearTimeout(timer);
  }, [catIndex, catName]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") step(1);
      if (e.key === "ArrowUp") step(-1);
      if (e.key === "ArrowRight") onCat(1);
      if (e.key === "ArrowLeft") onCat(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onCat, step]);

  /* autoplay estilo stories: 30s por prato, depois próximo prato / próxima categoria */
  const halted = !playing || paused || coach || !!flash;

  useEffect(() => {
    progRef.current = 0;
    if (barRef.current) barRef.current.style.width = "0%";
  }, [index, catIndex]);

  useEffect(() => {
    if (halted || total === 0) return undefined;
    const tickMs = 100;
    const timer = setInterval(() => {
      progRef.current = Math.min(1, progRef.current + tickMs / STORY_MS);
      if (barRef.current) barRef.current.style.width = `${(progRef.current * 100).toFixed(2)}%`;
      if (progRef.current >= 1) {
        clearInterval(timer);
        if (index < total - 1) onIndex(index + 1);
        else onCat(1);
      }
    }, tickMs);
    return () => clearInterval(timer);
  }, [halted, index, total, onIndex, onCat, catIndex]);

  /* gesto: vertical troca de prato, horizontal troca de categoria */
  const gestureStart = (x, y) => { drag.current = { x, y }; };
  const gestureEnd = (x, y) => {
    if (!drag.current) return;
    const dx = x - drag.current.x;
    const dy = y - drag.current.y;
    drag.current = null;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
      onCat(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dy) > 44 && Math.abs(dy) > Math.abs(dx)) step(dy < 0 ? 1 : -1);
  };

  if (!cur) return null;
  const video = cur.video_url ? mediaUrl(cur.video_url) : null;
  const poster = cur.image_url ? mediaUrl(cur.image_url) : null;

  return (
    <div
      onPointerDown={(e) => gestureStart(e.clientX, e.clientY)}
      onPointerUp={(e) => gestureEnd(e.clientX, e.clientY)}
      onPointerCancel={() => { drag.current = null; }}
      onTouchStart={(e) => { const t = e.touches[0]; if (t) gestureStart(t.clientX, t.clientY); }}
      onTouchEnd={(e) => { const t = e.changedTouches[0]; if (t) gestureEnd(t.clientX, t.clientY); }}
      onWheel={(e) => {
        const now = Date.now();
        if (now - wheelAt.current < 620 || Math.abs(e.deltaY) < 12) return;
        wheelAt.current = now;
        step(e.deltaY > 0 ? 1 : -1);
      }}
      className="pmFixedLayer"
      style={{ background: "#000", touchAction: "none", zIndex: 200 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Assistindo: ${cur.title}`}
    >
      {video ? (
        <video
          key={cur.id}
          src={video}
          poster={poster || undefined}
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="auto"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : poster ? (
        <img src={poster} alt={cur.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg,#161110 0 9px,#1f1814 9px 18px)" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(11,9,8,.82) 0%,rgba(11,9,8,.1) 20%,rgba(11,9,8,0) 38%,rgba(11,9,8,.84) 72%,#0B0908 100%)" }} />

      <div style={{ position: "absolute", top: "calc(14px + env(safe-area-inset-top))", left: 16, right: 16, display: "flex", gap: 4, zIndex: 6 }}>
        {items.map((it, i) => (
          <span key={it.id} style={{ flex: 1, height: 3, borderRadius: 2, overflow: "hidden", background: "rgba(247,242,237,.22)" }}>
            <span
              ref={i === index ? barRef : null}
              style={{ display: "block", height: "100%", width: i < index ? "100%" : "0%", borderRadius: 2, background: C.creme }}
            />
          </span>
        ))}
      </div>

      <div style={{ position: "absolute", top: "calc(26px + env(safe-area-inset-top))", left: 16, right: 16, display: "flex", alignItems: "center", gap: 9, zIndex: 6 }}>
        <RoundBtn onClick={onClose} ariaLabel="Fechar"><IconClose /></RoundBtn>
        <button
          type="button"
          onClick={() => onCat(1)}
          aria-label="Trocar de categoria"
          style={{
            flex: 1,
            minWidth: 0,
            height: 44,
            borderRadius: 99,
            border: "1px solid rgba(255,255,255,.14)",
            background: "rgba(11,9,8,.4)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            padding: "0 12px",
            cursor: "pointer",
          }}
        >
          {catCount > 1 && <Caret dir="left" color="rgba(247,242,237,.45)" />}
          <span style={{ font: `600 11px/1 ${F.body}`, letterSpacing: ".13em", textTransform: "uppercase", color: C.creme, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {catName || cur.category_name || "Cardápio"}
          </span>
          {catCount > 1 && <Caret dir="right" color="rgba(247,242,237,.45)" />}
        </button>
        <RoundBtn onClick={() => setPlaying((v) => !v)} ariaLabel={playing ? "Pausar reprodução automática" : "Retomar reprodução automática"} active={!playing}>
          {playing ? <IconPause /> : <IconPlay size={15} />}
        </RoundBtn>
        <RoundBtn onClick={onToggleMute} ariaLabel={muted ? "Ativar som" : "Silenciar"} active={!muted}>
          {muted ? <IconMuted /> : <IconSound />}
        </RoundBtn>
      </div>

      {total > 1 && (
        <div style={{ position: "absolute", right: 14, top: "44%", transform: "translateY(-50%)", zIndex: 6, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <button type="button" onClick={() => step(-1)} aria-label="Anterior" style={{ width: 44, height: 44, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            <Caret dir="up" color="rgba(247,242,237,.55)" size={8} />
          </button>
          <span style={{ font: `500 10px/1 ${F.head}`, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{index + 1}/{total}</span>
          <button type="button" onClick={() => step(1)} aria-label="Próximo" style={{ width: 44, height: 44, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            <Caret dir="down" color="rgba(247,242,237,.55)" size={8} />
          </button>
        </div>
      )}

      <div
        className="pmScroll"
        style={{ position: "absolute", left: 16, right: 16, bottom: "calc(20px + env(safe-area-inset-bottom))", maxHeight: "62%", overflowY: "auto", zIndex: 6 }}
      >
        {(cur.is_featured || cur.has_active_promotion) && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px 5px 6px",
              borderRadius: 99,
              background: "rgba(255,106,40,.16)",
              border: "1px solid rgba(255,106,40,.4)",
              marginBottom: 11,
            }}
          >
            <span style={{ width: 13, height: 13, borderRadius: 99, background: "linear-gradient(160deg,#FF8B57,#C93F12)" }} />
            <span style={{ font: `600 8.5px/1 ${F.body}`, letterSpacing: ".11em", textTransform: "uppercase", color: C.brasaPale }}>
              {cur.has_active_promotion ? cur.promotion?.label || "Promoção" : cur.featured_label || "Destaque da casa"}
            </span>
          </div>
        )}
        <h2 style={{ margin: 0, font: `600 clamp(24px,7.6vw,2px)/1.1 ${F.head}`, letterSpacing: "-.015em", color: C.creme, textWrap: "balance" }}>{titleCase(cur.title)}</h2>
        {cur.description && (
          <p style={{ margin: "9px 0 0", font: `400 13.5px/1.45 ${F.body}`, color: "rgba(247,242,237,.72)", maxWidth: 340, textWrap: "pretty" }}>{sentenceCase(cur.description)}</p>
        )}
        {cur.sizes?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 13 }}>
            {cur.sizes.map((sz, i) => (
              <span key={i} style={{ height: 34, padding: "0 14px", borderRadius: 99, border: "1px solid rgba(255,255,255,.16)", background: "rgba(11,9,8,.34)", backdropFilter: "blur(8px)", color: "rgba(247,242,237,.75)", font: `500 12px/34px ${F.body}` }}>
                {sz.name} · {money(sz.price_cents)}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Price item={cur} size="lg" />
          </div>
          <button
            type="button"
            onClick={() => onAdd(cur)}
            aria-label="Adicionar à lista"
            style={{ width: 52, height: 52, flex: "none", borderRadius: 99, border: `1.5px solid ${C.creme}`, background: "rgba(247,242,237,.06)", backdropFilter: "blur(10px)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <IconComanda size={26} />
          </button>
          <button
            type="button"
            onClick={() => onDetail(cur)}
            aria-label="Detalhes do prato"
            style={{ width: 52, height: 52, flex: "none", borderRadius: 99, border: `1.5px solid ${C.brasa}`, background: "rgba(255,106,40,.1)", color: C.brasa, font: `600 18px/1 ${F.head}`, cursor: "pointer", padding: 0 }}
          >
            i 
          </button> 
        </div>
      </div>

      {listCount > 0 && (
        <button
          type="button"
          onClick={onOpenList}
          aria-label="Ver minha lista"
          style={{
            position: "absolute",
            right: 16,
            bottom: "calc(22px + env(safe-area-inset-bottom))",
            zIndex: 7,
            height: 54,
            padding: "0 18px 0 14px",
            borderRadius: 99,
            border: "none",
            background: C.brasa,
            boxShadow: "0 14px 34px rgba(255,106,40,.4)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <IconComanda size={22} color="#160C06" />
          <span style={{ font: `600 13.5px/1 ${F.body}`, color: "#160C06" }}>Lista · {listCount}</span>
        </button>
      )}

      {flash && (
        <div style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(11,9,8,.9)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", padding: "0 24px", animation: "pmCatFlash 1.5s ease forwards" }}>
          <div style={{ textAlign: "center", animation: "pmCatName 1.5s ease forwards" }}>
            <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: ".2em", textTransform: "uppercase", color: C.brasaSoft, marginBottom: 14 }}>Categoria</div>
            <div style={{ font: `600 clamp(26px,8.6vw,34px)/1.06 ${F.head}`, letterSpacing: "-.015em", color: C.creme }}>{flash}</div>
            <div style={{ font: `400 12.5px/1 ${F.body}`, color: C.faint, marginTop: 14 }}>
              {total} {total === 1 ? "prato" : "pratos"} nesta categoria
            </div>
          </div>
        </div>
      )}

      {coach && <CoachOverlay onDone={onCoachDone} />}
    </div>
  );
};

/* ─── folha de detalhes (sobe por cima, não troca de página) ────────── */
const DetailSheet = ({ item, onClose, onAdd, pairs = [], onOpenPair }) => {
  if (!item) return null;
  const thumb = item.image_url ? mediaUrl(item.image_url) : null;
  const promo = item.has_active_promotion;

  return (
    <div className="pmFixedLayer" style={{ zIndex: 300 }} role="dialog" aria-modal="true" aria-label={`Detalhes: ${item.title}`}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(6,5,4,.62)", backdropFilter: "blur(2px)", animation: "pmFade .22s ease" }} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: MAXW,
          right: "auto",
          bottom: 0,
          top: "14%",
          background: C.elev,
          borderRadius: "28px 28px 0 0",
          borderTop: `1px solid rgba(255,236,222,.14)`,
          boxShadow: "0 -24px 60px rgba(0,0,0,.72)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "pmSheetUp .34s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div style={{ flex: "none", padding: "9px 0 0", display: "flex", justifyContent: "center" }}>
          <span style={{ width: 38, height: 4, borderRadius: 99, background: "rgba(247,242,237,.2)" }} />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Minimizar detalhes"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 6,
            width: 38,
            height: 38,
            borderRadius: 99,
            border: `1px solid ${C.border}`,
            background: "rgba(23,18,16,.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <IconClose size={13} />
        </button>

        <div className="pmScroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <div style={{ padding: "14px 20px 0", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 76, height: 76, flex: "none", borderRadius: 16, overflow: "hidden", background: "repeating-linear-gradient(135deg,#191310 0 6px,#211a14 6px 12px)", border: `1px solid ${C.border}` }}>
              {thumb && <img src={thumb} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 34 }}>
              {item.category_name && (
                <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: ".15em", textTransform: "uppercase", color: C.brasaSoft }}>{item.category_name}</div>
              )}
              <h2 style={{ margin: "8px 0 0", font: `600 clamp(20px,6.2vw,24px)/1.14 ${F.head}`, letterSpacing: "-.015em", color: C.creme, textWrap: "balance" }}>{item.title}</h2>
            </div>
          </div>

          <div style={{ padding: "0 20px 20px" }}>
            {item.description && (
              <p style={{ margin: "14px 0 0", font: `400 13.5px/1.5 ${F.body}`, color: "rgba(247,242,237,.66)", textWrap: "pretty" }}>{item.description}</p>
            )}

            {item.sizes?.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: ".14em", textTransform: "uppercase", color: C.faint, marginBottom: 10 }}>Tamanhos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {item.sizes.map((sz, i) => (
                    <span key={i} style={{ minHeight: 46, padding: "8px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.card2, display: "flex", flexDirection: "column", gap: 4, minWidth: 96 }}>
                      <span style={{ font: `500 12px/1 ${F.body}`, color: "rgba(247,242,237,.7)" }}>{sz.name}</span>
                      <span style={{ font: `600 13px/1 ${F.head}`, color: C.brasa }}>{money(sz.price_cents)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.option_groups?.map((g, gi) => (
              <div key={gi} style={{ marginTop: 20 }}>
                <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: ".14em", textTransform: "uppercase", color: C.faint, marginBottom: 10 }}>{g.name}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {g.options.map((o, oi) => (
                    <span key={oi} style={{ height: 40, padding: "0 14px", borderRadius: 99, border: `1px solid ${C.border}`, background: C.card2, color: "rgba(247,242,237,.72)", font: `500 12px/40px ${F.body}` }}>
                      {o.name}{o.price_cents ? ` +${money(o.price_cents)}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {item.standalone_options?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: ".14em", textTransform: "uppercase", color: C.faint, marginBottom: 10 }}>Adicionais</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {item.standalone_options.map((o, oi) => (
                    <span key={oi} style={{ height: 40, padding: "0 14px", borderRadius: 99, border: `1px solid ${C.border}`, background: C.card2, color: "rgba(247,242,237,.72)", font: `500 12px/40px ${F.body}` }}>
                      {o.name}{o.price_cents ? ` +${money(o.price_cents)}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.allergens && (
              <div style={{ marginTop: 20 }}>
                <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: ".14em", textTransform: "uppercase", color: C.faint, marginBottom: 10 }}>Alérgenos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {String(item.allergens).split(",").map((a) => (
                    <span key={a} style={{ height: 34, padding: "0 12px", borderRadius: 99, border: `1px solid ${C.border}`, background: C.card2, color: "rgba(247,242,237,.72)", font: `500 11.5px/34px ${F.body}`, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span>{allergenIcons[a.trim()] || "⚠️"}</span>{a.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {promo && item.promotion?.condition && (
              <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 14, background: "rgba(95,208,138,.08)", border: "1px solid rgba(95,208,138,.22)", font: `400 12.5px/1.45 ${F.body}`, color: C.verde }}>
                {item.promotion.condition}
              </div>
            )}

            {item.ar_model_url && (
              <a
                href={mediaUrl(item.ar_model_url)}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, height: 44, padding: "0 18px", borderRadius: 99, border: `1px solid ${C.border}`, background: C.card, color: C.creme, font: `500 12.5px/1 ${F.body}`, textDecoration: "none" }}
              >
                <i className="fas fa-cube" /> Ver em 3D
              </a>
            )}
          </div>

          {pairs.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ padding: "0 20px", borderTop: `1px solid rgba(255,236,222,.08)`, paddingTop: 18 }}>
                <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: ".14em", textTransform: "uppercase", color: C.faint, marginBottom: 12 }}>Combina com</div>
              </div>
              <div className="pmScroll" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 20px 22px" }}>
                {pairs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenPair && onOpenPair(p)}
                    style={{ flex: "none", width: 132, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", color: "inherit" }}
                  >
                    <span style={{ position: "relative", display: "block", aspectRatio: "4/3", borderRadius: 13, overflow: "hidden", background: "repeating-linear-gradient(135deg,#191310 0 6px,#211a14 6px 12px)", border: `1px solid ${C.border}` }}>
                      {p.image_url && (
                        <img src={mediaUrl(p.image_url)} alt={p.title} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      {p.video_url && (
                        <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 26, height: 26, borderRadius: 99, background: "rgba(11,9,8,.4)", border: "1px solid rgba(255,255,255,.24)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IconPlay size={10} />
                        </span>
                      )}
                    </span>
                    <span style={{ display: "block", font: `600 12px/1.3 ${F.body}`, color: C.creme, marginTop: 7 }}>{p.title}</span>
                    <span style={{ display: "block", marginTop: 3 }}>
                      <Price item={p} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: "none", padding: "12px 18px calc(18px + env(safe-area-inset-bottom))", borderTop: `1px solid rgba(255,236,222,.08)`, background: C.elev, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: "none" }}>
            <Price item={item} size="md" />
          </div>
          <button
            type="button"
            onClick={() => onAdd(item)}
            style={{ flex: 1, minWidth: 0, height: 54, border: "none", borderRadius: 99, background: C.brasa, color: "#160C06", font: `600 14.5px/1 ${F.body}`, cursor: "pointer", boxShadow: "0 10px 26px rgba(255,106,40,.26)", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}
          >
            <IconComanda size={22} color="#160C06" /> Adicionar à lista
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── modal de perfil do restaurante ────────────────────────────────── */
const ProfileModal = ({ settings, restaurant, establishments, logo, cover, extraLinks, onClose, onTrack }) => {
  const initials = String(settings.store_name || "PM")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const socials = [];
  if (settings.instagram)
    socials.push({ label: "Instagram", icon: "fab fa-instagram", type: "instagram", url: `https://instagram.com/${String(settings.instagram).replace("@", "")}` });
  if (settings.whatsapp)
    socials.push({ label: "WhatsApp", icon: "fab fa-whatsapp", type: "whatsapp", url: `https://wa.me/55${String(settings.whatsapp).replace(/\D/g, "")}` });
  extraLinks.forEach((l) => socials.push({ label: l.name, icon: l.icon || "fas fa-link", type: l.type || "other", url: l.url }));

  const address = settings.address || restaurant?.address || "";
  const hours = settings.hours || settings.opening_hours || "";
  const phone = settings.phone || settings.whatsapp || "";
  const mapUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : "";

  return (
    <div className="pmFixedLayer" style={{ zIndex: 280 }} role="dialog" aria-modal="true" aria-label="Perfil do restaurante">
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(6,5,4,.74)", backdropFilter: "blur(8px)", animation: "pmFade .22s ease" }} />
      <div
        className="pmScroll"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: "calc(100% - 28px)",
          maxWidth: MAXW - 28,
          maxHeight: "88%",
          overflowY: "auto",
          background: C.elev,
          border: `1px solid rgba(255,236,222,.12)`,
          borderRadius: 26,
          boxShadow: "0 30px 70px rgba(0,0,0,.7)",
          animation: "pmPop .3s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div style={{ position: "relative", height: 132, overflow: "hidden", borderRadius: "26px 26px 0 0", background: "repeating-linear-gradient(135deg,#191310 0 8px,#211a14 8px 16px)" }}>
          {cover && <img src={cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(11,9,8,.35),rgba(18,14,12,.96))" }} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar perfil"
            style={{ position: "absolute", top: 12, right: 12, width: 38, height: 38, borderRadius: 99, border: "1px solid rgba(255,255,255,.2)", background: "rgba(11,9,8,.55)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
          >
            <IconClose size={13} />
          </button>
        </div>

        <div style={{ padding: "0 20px 22px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              position: "relative",
              zIndex: 2,
              width: 92,
              height: 92,
              marginTop: -46,
              borderRadius: 99,
              background: "linear-gradient(150deg,#2A1D16,#150F0C)",
              border: `3px solid ${C.elev}`,
              boxShadow: "0 12px 30px rgba(0,0,0,.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {logo ? (
              <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ font: `700 27px/1 ${F.head}`, color: C.dourado }}>{initials}</span>
            )}
          </div>

          <h2 style={{ margin: "14px 0 0", font: `600 22px/1.15 ${F.head}`, letterSpacing: "-.015em", textAlign: "center", color: C.creme }}>{settings.store_name}</h2>
          {settings.tagline && (
            <p style={{ margin: "8px 0 0", font: `400 13px/1.5 ${F.body}`, color: C.muted, textAlign: "center", maxWidth: 320, textWrap: "pretty" }}>{settings.tagline}</p>
          )}

          {socials.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 20, width: "100%" }}>
              {socials.map((sl, i) => (
                <a
                  key={i}
                  href={sl.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onTrack(sl.type, sl.label)}
                  style={{ height: 44, padding: "0 16px", borderRadius: 99, border: `1px solid ${C.border}`, background: C.card2, color: C.creme, font: `600 12.5px/44px ${F.body}`, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  <i className={sl.icon} style={{ color: C.brasa }} /> {sl.label}
                </a>
              ))}
            </div>
          )}

          {(address || hours || phone) && (
            <div style={{ width: "100%", marginTop: 22, borderTop: `1px solid rgba(255,236,222,.08)`, paddingTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              {address && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ font: `600 9.5px/1.6 ${F.body}`, letterSpacing: ".13em", textTransform: "uppercase", color: C.faint, width: 74, flex: "none" }}>Endereço</span>
                  <span style={{ flex: 1, minWidth: 0, font: `400 13px/1.5 ${F.body}`, color: "rgba(247,242,237,.82)" }}>{address}</span>
                </div>
              )}
              {hours && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ font: `600 9.5px/1.6 ${F.body}`, letterSpacing: ".13em", textTransform: "uppercase", color: C.faint, width: 74, flex: "none" }}>Horário</span>
                  <span style={{ flex: 1, minWidth: 0, font: `400 13px/1.5 ${F.body}`, color: "rgba(247,242,237,.82)" }}>{hours}</span>
                </div>
              )}
              {phone && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ font: `600 9.5px/1.6 ${F.body}`, letterSpacing: ".13em", textTransform: "uppercase", color: C.faint, width: 74, flex: "none" }}>Contato</span>
                  <span style={{ flex: 1, minWidth: 0, font: `400 13px/1.5 ${F.body}`, color: "rgba(247,242,237,.82)" }}>{phone}</span>
                </div>
              )}
            </div>
          )}

          {establishments.length > 0 && (
            <div style={{ width: "100%", marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ font: `600 9.5px/1.6 ${F.body}`, letterSpacing: ".13em", textTransform: "uppercase", color: C.faint }}>Unidades</span>
              {establishments.map((est) => (
                <div key={est.id} style={{ border: `1px solid ${C.border}`, background: C.card2, borderRadius: 14, padding: "11px 14px" }}>
                  <div style={{ font: `600 12.5px/1.2 ${F.body}`, color: C.creme }}>{est.name}</div>
                  {est.address && <div style={{ font: `400 11.5px/1.4 ${F.body}`, color: C.muted, marginTop: 4 }}>{est.address}</div>}
                </div>
              ))}
            </div>
          )}

          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => onTrack("map", "Mapa")}
              style={{ width: "100%", marginTop: 20, height: 52, borderRadius: 99, background: C.brasa, color: "#160C06", font: `600 14px/52px ${F.body}`, textAlign: "center", textDecoration: "none", boxShadow: "0 10px 26px rgba(255,106,40,.26)" }}
            >
              Ver no mapa
            </a>
          )}

          <PlaymenuFooter compact />
        </div>
      </div>
    </div>
  );
};

/* ─── minha lista (comanda local) ───────────────────────────────────── */
const ListPanel = ({ entries, total, storeName, onClose, onQty, onShowWaiter }) => (
  <div className="pmFixedLayer" style={{ zIndex: 260, background: C.base }} role="dialog" aria-modal="true" aria-label="Minha lista">
    <div style={{ position: "absolute", inset: 0, maxWidth: MAXW, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", padding: "calc(26px + env(safe-area-inset-top)) 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: ".15em", textTransform: "uppercase", color: C.brasaSoft }}>{storeName}</div>
            <h2 style={{ margin: "9px 0 0", font: `600 clamp(24px,7.4vw,28px)/1.1 ${F.head}`, letterSpacing: "-.015em", color: C.creme }}>Minha lista</h2>
            <p style={{ margin: "8px 0 0", font: `400 13px/1.45 ${F.body}`, color: C.muted, maxWidth: 260 }}>Sem pedido pelo app. Monte a lista e mostre ao garçom.</p>
          </div>
          <RoundBtn onClick={onClose} ariaLabel="Fechar" style={{ border: `1px solid ${C.border}`, background: C.card }}><IconClose /></RoundBtn>
        </div>
      </div>

      <div className="pmScroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 20px 8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map((e) => (
            <div key={e.id} style={{ display: "flex", gap: 12, alignItems: "center", background: C.card, border: `1px solid rgba(255,236,222,.09)`, borderRadius: 16, padding: 10 }}>
              <div style={{ width: 56, height: 56, flex: "none", borderRadius: 12, overflow: "hidden", background: "repeating-linear-gradient(135deg,#191310 0 6px,#211a14 6px 12px)" }}>
                {e.image_url && <img src={mediaUrl(e.image_url)} alt={e.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `600 13px/1.25 ${F.body}`, color: C.creme }}>{e.title}</div>
                {e.category_name && <div style={{ font: `400 11px/1 ${F.body}`, color: C.faint, marginTop: 4 }}>{e.category_name}</div>}
                <div style={{ font: `600 12.5px/1 ${F.head}`, color: C.brasaSoft, marginTop: 5 }}>{money(e.unit * e.qty)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2, flex: "none" }}>
                <button type="button" onClick={() => onQty(e.id, -1)} aria-label="Menos" style={{ width: 34, height: 34, borderRadius: 99, border: `1px solid rgba(255,236,222,.14)`, background: "transparent", color: C.creme, font: `400 17px/1 ${F.body}`, cursor: "pointer", padding: 0 }}>−</button>
                <span style={{ width: 26, textAlign: "center", font: `600 14px/1 ${F.head}`, color: C.creme, fontVariantNumeric: "tabular-nums" }}>{e.qty}</span>
                <button type="button" onClick={() => onQty(e.id, 1)} aria-label="Mais" style={{ width: 34, height: 34, borderRadius: 99, border: `1px solid rgba(255,236,222,.14)`, background: "transparent", color: C.creme, font: `400 17px/1 ${F.body}`, cursor: "pointer", padding: 0 }}>+</button>
              </div>
            </div>
          ))}
        </div>
        {!entries.length && (
          <div style={{ padding: "40px 0", textAlign: "center", font: `400 13px/1.55 ${F.body}`, color: C.faint }}>
            Sua lista está vazia.<br />Toque no ícone de comanda enquanto assiste.
          </div>
        )}
        <PlaymenuFooter compact />
      </div>

      {entries.length > 0 && (
        <div style={{ flex: "none", padding: "14px 20px calc(18px + env(safe-area-inset-bottom))", borderTop: `1px solid rgba(255,236,222,.08)`, background: C.base }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
            <span style={{ font: `400 12px/1 ${F.body}`, color: C.muted }}>
              Valor total de {entries.length} {entries.length === 1 ? "item" : "itens"}
            </span>
            <span style={{ font: `600 22px/1 ${F.head}`, color: C.creme, fontVariantNumeric: "tabular-nums" }}>{money(total)}</span>
          </div>
          {/* <button
            type="button"
            onClick={onShowWaiter}
            style={{ width: "100%", height: 54, border: "none", borderRadius: 99, background: C.brasa, color: "#160C06", font: `600 14.5px/1 ${F.body}`, cursor: "pointer", boxShadow: "0 10px 26px rgba(255,106,40,.26)" }}
          >
            Mostrar ao garçom
          </button> */}
        </div>
      )}
    </div>
  </div>
);

const WaiterCard = ({ entries, total, storeName, onClose }) => (
  <div
    onClick={onClose}
    className="pmFixedLayer"
    style={{ zIndex: 320, background: C.creme, color: C.base, cursor: "pointer" }}
    role="dialog"
    aria-modal="true"
    aria-label="Comanda para o garçom"
  >
    <div style={{ position: "absolute", inset: 0, maxWidth: MAXW, margin: "0 auto", padding: "calc(34px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", font: `600 10px/1 ${F.body}`, letterSpacing: ".16em", textTransform: "uppercase", color: C.carvao }}>{storeName}</div>
      <h2 style={{ flex: "none", margin: "10px 0 0", font: `600 clamp(24px,7.4vw,30px)/1.08 ${F.head}`, letterSpacing: "-.015em" }}>Pedido do cliente</h2>
      <div className="pmScroll" style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 13, flex: 1, minHeight: 0, overflowY: "auto" }}>
        {entries.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "baseline", gap: 12, borderBottom: "1px solid rgba(11,9,8,.12)", paddingBottom: 12 }}>
            <span style={{ font: `600 20px/1 ${F.head}`, color: C.carvao, flex: "none", width: 30 }}>{e.qty}×</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: `600 15px/1.2 ${F.body}` }}>{e.title}</div>
              {e.category_name && <div style={{ font: `400 12.5px/1 ${F.body}`, color: "rgba(11,9,8,.55)", marginTop: 4 }}>{e.category_name}</div>}
            </div>
            <span style={{ font: `600 14px/1 ${F.head}`, color: "rgba(11,9,8,.7)", flex: "none" }}>{money(e.unit * e.qty)}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: "none", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, paddingTop: 14, borderTop: "1px solid rgba(11,9,8,.18)" }}>
        <span style={{ font: `400 13px/1 ${F.body}`, color: "rgba(11,9,8,.5)" }}>Total</span>
        <span style={{ font: `600 26px/1 ${F.head}` }}>{money(total)}</span>
      </div>
      <div style={{ flex: "none", marginTop: 14, textAlign: "center", font: `500 11px/1 ${F.body}`, letterSpacing: ".1em", color: "rgba(11,9,8,.4)" }}>toque para voltar</div>
    </div>
  </div>
);

/* ─── avaliações ────────────────────────────────────────────────────── */
const ReviewsSheet = ({ reviews, summary, rating, setRating, onSubmit, notice, onClose }) => (
  <div className="pmFixedLayer" style={{ zIndex: 240, background: "rgba(6,5,4,.72)", backdropFilter: "blur(10px)" }} role="dialog" aria-modal="true" aria-label="Avaliações">
    <div
      className="pmScroll"
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: MAXW,
        bottom: 0,
        top: "max(76px,12dvh)",
        background: C.elev,
        borderRadius: "28px 28px 0 0",
        borderTop: `1px solid ${C.border}`,
        overflowY: "auto",
        padding: "0 20px calc(40px + env(safe-area-inset-bottom))",
        animation: "pmSheetUp .34s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <div style={{ position: "sticky", top: 0, background: C.elev, padding: "10px 0 4px", display: "flex", justifyContent: "center", zIndex: 3 }}>
        <span style={{ width: 38, height: 4, borderRadius: 99, background: "rgba(247,242,237,.2)" }} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingTop: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: ".15em", textTransform: "uppercase", color: C.brasaSoft }}>Avaliações</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ font: `400 20px/1 ${F.body}`, color: C.dourado }}>★</span>
            <span style={{ font: `600 26px/1 ${F.head}`, color: C.dourado, fontVariantNumeric: "tabular-nums" }}>
              {summary?.total ? (summary.avg_rating || 0).toFixed(1).replace(".", ",") : "—"}
            </span>
            <span style={{ font: `400 12px/1 ${F.body}`, color: C.faint }}>{summary?.total || 0} avaliações</span>
          </div>
        </div>
        <RoundBtn onClick={onClose} ariaLabel="Fechar" style={{ border: `1px solid ${C.border}`, background: C.card2 }}><IconClose /></RoundBtn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {reviews?.length ? (
          reviews.map((r) => (
            <div key={r.id} style={{ background: C.card2, border: `1px solid rgba(255,236,222,.08)`, borderRadius: 16, padding: "14px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ font: `600 13px/1 ${F.body}`, color: C.creme }}>{r.customer_name || "Cliente"}</span>
                <span style={{ font: `400 13px/1 ${F.body}`, color: C.dourado, flex: "none" }}>{"★".repeat(r.rating)}</span>
              </div>
              {r.comment && <p style={{ margin: "8px 0 0", font: `400 12.5px/1.45 ${F.body}`, color: C.muted }}>{r.comment}</p>}
            </div>
          ))
        ) : (
          <div style={{ padding: "24px 0", textAlign: "center", font: `400 13px/1.5 ${F.body}`, color: C.faint }}>Ainda não existem avaliações aprovadas.</div>
        )}
      </div>

      <div style={{ marginTop: 22, borderTop: `1px solid rgba(255,236,222,.08)`, paddingTop: 20 }}>
        <div style={{ font: `600 15px/1 ${F.body}`, color: C.creme }}>Deixe sua avaliação</div>
        <form onSubmit={onSubmit}>
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`Nota ${n}`}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: n <= rating ? "1px solid rgba(240,178,74,.5)" : `1px solid ${C.border}`,
                  background: n <= rating ? "rgba(240,178,74,.14)" : C.card2,
                  color: n <= rating ? C.dourado : "rgba(247,242,237,.28)",
                  font: `400 20px/1 ${F.body}`,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ★
              </button>
            ))}
          </div>
          <input
            name="customer_name"
            maxLength={120}
            placeholder="Seu nome (opcional)"
            style={{ width: "100%", height: 50, marginTop: 12, borderRadius: 14, background: C.card2, border: `1px solid rgba(255,236,222,.1)`, padding: "0 16px", color: C.creme, font: `400 13.5px/1 ${F.body}`, outline: "none" }}
          />
          <textarea
            name="comment"
            maxLength={1000}
            rows={3}
            placeholder="Conte como foi sua experiência"
            style={{ width: "100%", marginTop: 10, borderRadius: 14, background: C.card2, border: `1px solid rgba(255,236,222,.1)`, padding: "14px 16px", color: C.creme, font: `400 13.5px/1.5 ${F.body}`, outline: "none", resize: "none" }}
          />
          <button
            type="submit"
            data-testid="submit-review-btn"
            style={{ width: "100%", height: 52, marginTop: 12, border: "none", borderRadius: 99, background: C.brasa, color: "#160C06", font: `600 14.5px/1 ${F.body}`, cursor: "pointer" }}
          >
            Enviar para aprovação
          </button>
        </form>
        {notice && (
          <div style={{ marginTop: 14, padding: "13px 16px", borderRadius: 14, background: "rgba(95,208,138,.08)", border: "1px solid rgba(95,208,138,.22)", font: `400 12.5px/1.45 ${F.body}`, color: C.verde }} role="status">
            {notice}
          </div>
        )}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   PÁGINA
══════════════════════════════════════════════════════════════════════ */
export default function PublicMenu({ preview = false }) {
  const [params, setParams] = useSearchParams();
  const { restaurantSlug = "" } = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [heroIdx, setHeroIdx] = useState(0);
  const [viewer, setViewer] = useState(null); // { cat, items, index }
  const [coach, setCoach] = useState(false);
  const [coachSeen, setCoachSeen] = useState(true);
  const [detail, setDetail] = useState(null);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [waiterOpen, setWaiterOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewNotice, setReviewNotice] = useState("");
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState("");
  const [list, setList] = useState({});
  const productCacheRef = useRef(new Map());
  const toastTimer = useRef(null);

  const query = {
    r: restaurantSlug || params.get("r") || "",
    q: params.get("q") || "",
    cat: Number(params.get("cat") || 0),
    est: Number(params.get("est") || 0),
    preview,
  };
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    api
      .get("/public/menu", { params: JSON.parse(queryKey) })
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.response?.data?.detail || "Restaurante não encontrado."));
  }, [queryKey]);

  /* lista local por restaurante */
  const storageKey = data?.restaurant?.slug ? `playmenu:list:${data.restaurant.slug}` : "";
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setList(JSON.parse(raw));
    } catch {
      /* storage indisponível */
    }
  }, [storageKey]);
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(list));
    } catch {
      /* storage indisponível */
    }
  }, [list, storageKey]);

  /* trava o scroll do body enquanto há camada em tela cheia */
  const anyLayer = !!viewer || !!detail || reviewsOpen || profileOpen || listOpen || waiterOpen || reservationOpen;
  useEffect(() => {
    if (!anyLayer) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [anyLayer]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      else if (reservationOpen) setReservationOpen(false);
      if (detail) setDetail(null);
      else if (profileOpen) setProfileOpen(false);
      else if (waiterOpen) setWaiterOpen(false);
      else if (listOpen) setListOpen(false);
      else if (reviewsOpen) setReviewsOpen(false);
      else if (viewer) setViewer(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detail, profileOpen, reservationOpen, waiterOpen, listOpen, reviewsOpen, viewer]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const say = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  /* pré-carrega o vídeo assim que o usuário demonstra intenção */
  const [warmUrl, setWarmUrl] = useState("");
  const warmVideo = useCallback((url) => {
    if (url) setWarmUrl((current) => (current === url ? current : url));
  }, []);
  const cardIntent = (item) => ({
    onPointerEnter: () => warmVideo(item.video_url),
    onTouchStart: () => warmVideo(item.video_url),
    onFocus: () => warmVideo(item.video_url),
  });

  const allProducts = useMemo(() => data?.products || [], [data]);
  const featured = useMemo(() => allProducts.filter((item) => item.is_featured), [allProducts]);
  const promoted = useMemo(() => allProducts.filter((item) => item.has_active_promotion && !item.is_featured), [allProducts]);
  const groups = useMemo(() => {
    if (!data) return [];
    return data.categories
      .map((category) => ({
        category,
        // destacados aparecem também dentro da própria categoria (além do topo)
        products: data.products.filter((item) => !item.has_active_promotion && item.category_id === category.id),
      }))
      .filter((group) => group.products.length);
  }, [data]);
  const establishments = useMemo(() => data?.establishments || [], [data]);

  /* stories/hero = pratos destacados pelo restaurante */
  const stories = featured.length ? featured : allProducts.slice(0, 6);
  const hero = stories[heroIdx % (stories.length || 1)];
  useEffect(() => {
    if (stories.length < 2 || anyLayer) return undefined;
    const timer = setInterval(() => setHeroIdx((i) => (i + 1) % stories.length), 5200);
    return () => clearInterval(timer);
  }, [stories.length, anyLayer]);

  /* tutorial de gestos na primeira visita */
  useEffect(() => {
    try {
      setCoachSeen(window.localStorage.getItem("playmenu:coach") === "1");
    } catch {
      setCoachSeen(true);
    }
  }, []);
  const finishCoach = useCallback(() => {
    setCoach(false);
    setCoachSeen(true);
    try {
      window.localStorage.setItem("playmenu:coach", "1");
    } catch {
      /* storage indisponível */
    }
  }, []);

  /* feed agrupado por categoria — no máximo 9 produtos por categoria */
  const feedCats = useMemo(() => {
    if (!data) return [];
    const list = (data.categories || [])
      .map((category) => ({
        id: category.id,
        name: category.name,
        products: allProducts.filter((item) => item.category_id === category.id),
      }))
      .filter((group) => group.products.length);
    const known = new Set(list.map((group) => group.id));
    const orphans = allProducts.filter((item) => !known.has(item.category_id));
    if (orphans.length) list.push({ id: 0, name: "Cardápio", products: orphans });
    return list;
  }, [data, allProducts]);

  const openCategoryFeed = useCallback(
    (catIndex, productIndex = 0) => {
      const group = feedCats[catIndex];
      if (!group) return;
      setViewer({ cat: catIndex, items: group.products, index: Math.max(0, productIndex) });
      if (!coachSeen) setCoach(true);
    },
    [feedCats, coachSeen],
  );

  const openProduct = useCallback(
    (item) => {
      const catIndex = feedCats.findIndex((group) => group.products.some((p) => p.id === item.id));
      if (catIndex < 0) return;
      const productIndex = feedCats[catIndex].products.findIndex((p) => p.id === item.id);
      openCategoryFeed(catIndex, productIndex);
    },
    [feedCats, openCategoryFeed],
  );

  /* arrastar para os lados troca a categoria inteira */
  const stepCategory = useCallback(
    (delta) => {
      setViewer((current) => {
        if (!current || feedCats.length < 2) return current;
        const next = (current.cat + delta + feedCats.length) % feedCats.length;
        return { cat: next, items: feedCats[next].products, index: 0 };
      });
    },
    [feedCats],
  );

  /* detalhes completos (sizes, opcionais, alérgenos, AR) sobre o feed */
  const openDetail = useCallback(async (item) => {
    let full = productCacheRef.current.get(item.id);
    if (!full) {
      try {
        const response = await api.get(`/public/product/${item.id}`);
        full = response.data;
        productCacheRef.current.set(item.id, full);
      } catch {
        full = item;
      }
    }
    setDetail({ ...item, ...full });
  }, []);

  const addToList = useCallback(
    (item) => {
      setList((current) => {
        const existing = current[item.id];
        return {
          ...current,
          [item.id]: {
            qty: (existing?.qty || 0) + 1,
            title: item.title,
            unit: priceOf(item),
            image_url: item.image_url || "",
            category_name: item.category_name || "",
          },
        };
      });
      say(`${item.title} na sua lista`);
    },
    [say],
  );

  const changeQty = useCallback((id, delta) => {
    setList((current) => {
      const next = { ...current };
      const qty = (next[id]?.qty || 0) + delta;
      if (qty <= 0) delete next[id];
      else next[id] = { ...next[id], qty };
      return next;
    });
  }, []);

  const listEntries = useMemo(() => Object.entries(list).map(([id, value]) => ({ id, ...value })), [list]);
  const listCount = listEntries.reduce((sum, e) => sum + e.qty, 0);
  const listTotal = listEntries.reduce((sum, e) => sum + e.unit * e.qty, 0);

  /* "Combina com": usa o que o backend enviar; senão sugere itens de outras categorias */
  const pairsFor = useCallback(
    (item) => {
      if (!item) return [];
      const explicit = item.pairings || item.combos || item.suggestions;
      if (Array.isArray(explicit) && explicit.length) return explicit.slice(0, 8);
      const others = allProducts.filter((p) => p.id !== item.id && p.category_id !== item.category_id);
      const cheaper = others.filter((p) => priceOf(p) <= priceOf(item));
      return (cheaper.length >= 3 ? cheaper : others).slice().sort((a, b) => priceOf(a) - priceOf(b)).slice(0, 8);
    },
    [allProducts],
  );

  const trackLink = (linkType, linkLabel) => {
    if (!data?.restaurant?.id) return;
    api
      .post("/public/analytics", {
        event_type: "link_click",
        restaurant_id: data.restaurant.id,
        link_type: linkType,
        link_label: linkLabel,
      })
      .catch(() => {});
  };

  const submitReview = async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api.post("/public/reviews", { ...form, rating, restaurant_id: data.restaurant.id });
      setReviewNotice("Obrigado pela avaliação. Ela será exibida depois da aprovação do restaurante.");
    } catch (requestError) {
      setReviewNotice(requestError.response?.data?.detail || "Não foi possível enviar.");
    }
  };

  const globalCss = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap');
    .pmPage *{box-sizing:border-box}
    .pmPage img,.pmPage svg{max-width:100%}
    .pmScroll{scrollbar-width:none;-webkit-overflow-scrolling:touch}
    .pmScroll::-webkit-scrollbar{display:none}
    .pmFixedLayer{position:fixed;inset:0;overflow:hidden;overscroll-behavior:contain}
    .pmFooterLogo svg{display:block;width:100%;height:auto}
    .pmPage a{color:${C.brasa};text-decoration:none}
    .pmPage a:hover{color:#FF8B57}
    .pmPage input::placeholder,.pmPage textarea::placeholder{color:rgba(247,242,237,.35)}
    /* preços: estilo forçado para não herdar nem conflitar com CSS legado */
    .pmPage .pmPriceWrap{display:inline-flex!important;align-items:baseline!important;gap:8px!important;flex-wrap:wrap!important}
    .pmPage .pmPrice{display:inline-flex!important;align-items:baseline!important;font-family:'Space Grotesk',system-ui,sans-serif!important;font-weight:600!important;font-style:normal!important;font-variant-numeric:tabular-nums!important;letter-spacing:-.01em!important;text-transform:none!important;text-decoration:none!important;text-shadow:none!important;background:none!important;color:${C.brasa}!important;-webkit-text-fill-color:currentColor!important;white-space:nowrap!important}
    .pmPage .pmPrice .pmPriceSym{color:#e3e3e3fc;font-size:.5em!important;font-weight:600!important;margin-right:.16em!important;line-height:1!important}
    .pmPage .pmPrice .pmPriceInt{font-size:1em!important;font-weight:600!important;line-height:1!important}
    .pmPage .pmPrice .pmPriceDec{color:#e3e3e3fc;font-size:.6em!important;font-weight:600!important;align-self:flex-start!important;margin-top:.6em!important;line-height:1!important}
    .pmPage .pmPrice--sm{font-size:15px!important;line-height:1!important;color:${C.brasaSoft}!important}
    .pmPage .pmPrice--md{font-size:24px!important;line-height:1!important}
    .pmPage .pmPrice--lg{font-size:34px!important;line-height:1!important}
    .pmPage .pmPrice--promo{color:${C.verde}!important}
    .pmPage .pmPrice--old{font-family:'Schibsted Grotesk',system-ui,sans-serif!important;font-size:12px!important;font-weight:500!important;color:rgba(247,242,237,.45)!important;text-decoration:line-through!important}
    .pmPage button{font-family:${F.body};color:inherit;-webkit-appearance:none;appearance:none}
    .pmPage h1,.pmPage h2,.pmPage h3{font-family:'Space Grotesk',system-ui,sans-serif}
    @keyframes pmDrift{0%{transform:scale(1.04)}100%{transform:scale(1.16) translate3d(-2%,-2.5%,0)}}
    @keyframes pmFade{from{opacity:0}to{opacity:1}}
    @keyframes pmPop{from{opacity:0;transform:translate(-50%,-46%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
    @keyframes pmSheetUp{from{transform:translateY(56px);opacity:.3}to{transform:none;opacity:1}}
    @keyframes pmToast{0%{opacity:0;transform:translateY(14px)}12%{opacity:1;transform:none}82%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-8px)}}
    @keyframes pmCatFlash{0%{opacity:0}9%{opacity:1}82%{opacity:1}100%{opacity:0}}
    @keyframes pmCatName{0%{opacity:0;transform:translateY(16px) scale(.94)}12%{opacity:1;transform:none}84%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-10px)}}
    @keyframes pmHandV{0%{opacity:0;transform:translateY(46px)}7%{opacity:1}38%{opacity:1;transform:translateY(-34px)}45%{opacity:0;transform:translateY(-40px)}100%{opacity:0;transform:translateY(-40px)}}
    @keyframes pmHandH{0%{opacity:0;transform:translateX(-42px)}50%{opacity:0;transform:translateX(-42px)}57%{opacity:1}88%{opacity:1;transform:translateX(42px)}95%{opacity:0;transform:translateX(48px)}100%{opacity:0;transform:translateX(48px)}}
    @keyframes pmLabelV{0%{opacity:0}7%{opacity:1}40%{opacity:1}47%{opacity:0}100%{opacity:0}}
    @keyframes pmLabelH{0%{opacity:0}50%{opacity:0}57%{opacity:1}90%{opacity:1}96%{opacity:0}100%{opacity:0}}
  `;

  if (error) {
    return (
      <div className="pmPage" style={{ minHeight: "100dvh", background: C.base, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, color: C.muted, font: `400 14px/1.6 ${F.body}`, textAlign: "center" }} role="alert">
        <style>{globalCss}</style>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pmPage" style={{ minHeight: "100dvh", background: C.base, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, font: `400 14px/1.6 ${F.body}` }}>
        <style>{globalCss}</style>
        Carregando cardápio…
      </div>
    );
  }

  const { restaurant, settings, reviews, reviews_summary: summary } = data;
  const logo = mediaUrl(settings.logo_image);
  const cover = mediaUrl(settings.cover_image);
  const extraLinks = Array.isArray(settings.social_links) ? settings.social_links : [];
  const heroMedia = hero?.image_url ? mediaUrl(hero.image_url) : cover;
  const initials = String(settings.store_name || "PM").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="pmPage" style={{ background: C.base, color: C.creme, minHeight: "100dvh", fontFamily: F.body, WebkitFontSmoothing: "antialiased", WebkitTapHighlightColor: "transparent" }}>
      <style>{globalCss}</style>

      {params.get("from") === "admin" && (
        <Link
          to="/admin/"
          data-testid="back-to-admin"
          style={{ display: "block", textAlign: "center", padding: "10px 16px", background: C.card, color: C.muted, font: `500 12px/1 ${F.body}` }}
        >
          ← Voltar ao painel
        </Link>
      )}

      <div style={{ maxWidth: MAXW, margin: "0 auto", position: "relative" }}>
        {/* ── CAPA / HERO ── */}
        <div data-testid="menu-hero" style={{ position: "relative", height: "min(56dvh,470px)", minHeight: 340, overflow: "hidden", background: "#000" }}>
          {heroMedia ? (
            <img src={heroMedia} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animation: "pmDrift 16s ease-in-out infinite alternate" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#1a1008,#0B0908)" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(11,9,8,.35) 0%,rgba(11,9,8,.05) 30%,rgba(11,9,8,.22) 52%,rgba(11,9,8,.9) 84%,#0B0908 100%)" }} />
          {/* sombra de cima para baixo: garante leitura do nome e do horário */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 210, background: "linear-gradient(180deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.72) 28%,rgba(0,0,0,.4) 60%,rgba(0,0,0,0) 100%)", pointerEvents: "none" }} />

          {stories.length > 1 && (
            <div style={{ position: "absolute", top: "calc(14px + env(safe-area-inset-top))", left: 16, right: 16, display: "flex", gap: 4, zIndex: 5 }}>
              {stories.map((st, i) => (
                <span key={st.id} style={{ flex: 1, height: 2.5, borderRadius: 2, background: i === heroIdx % stories.length ? C.creme : "rgba(247,242,237,.24)" }} />
              ))}
            </div>
          )}

          <div style={{ position: "absolute", top: "calc(30px + env(safe-area-inset-top))", left: 16, right: 16, display: "flex", alignItems: "center", gap: 10, zIndex: 5 }}>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Ver perfil do restaurante"
              data-testid="open-profile-btn"
              style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", textAlign: "left", color: "inherit" }}
            >
              <span style={{ width: 44, height: 44, flex: "none", borderRadius: 14, overflow: "hidden", background: "linear-gradient(150deg,#2A1D16,#150F0C)", border: "1px solid rgba(255,236,222,.2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(0,0,0,.55)" }}>
                {logo ? <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ font: `700 15px/1 ${F.head}`, color: C.dourado }}>{initials}</span>}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ font: `600 16.5px/1.15 ${F.head}`, letterSpacing: "-.01em", textShadow: "0 2px 10px rgba(0,0,0,.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {settings.store_name}
                  </span>
                  <Caret dir="right" color="rgba(247,242,237,.65)" />
                </span>
                {settings.tagline && (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: C.verde, boxShadow: `0 0 8px ${C.verde}`, flex: "none" }} />
                    <span style={{ font: `400 11.5px/1.3 ${F.body}`, color: "rgba(247,242,237,.85)", textShadow: "0 2px 8px rgba(0,0,0,.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {settings.tagline}
                    </span>
                  </span>
                )}
              </span>
            </button>
            <RoundBtn onClick={() => setLiked((v) => !v)} ariaLabel={liked ? "Remover curtida" : "Curtir restaurante"} active={liked} style={liked ? { border: "1px solid rgba(255,106,40,.55)", background: "rgba(255,106,40,.18)" } : {}}>
              <IconHeart filled={liked} />
            </RoundBtn>
          </div>

          {hero && (
            <div style={{ position: "absolute", left: 16, right: 16, bottom: 18, zIndex: 5 }}>
              {(hero.is_featured || hero.has_active_promotion) && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 6px", borderRadius: 99, background: "rgba(255,106,40,.16)", border: "1px solid rgba(255,106,40,.4)", backdropFilter: "blur(8px)", marginBottom: 11 }}>
                  <span style={{ width: 13, height: 13, borderRadius: 99, background: "linear-gradient(160deg,#FF8B57,#C93F12)" }} />
                  <span style={{ font: `600 8.5px/1 ${F.body}`, letterSpacing: ".11em", textTransform: "uppercase", color: C.brasaPale }}>
                    {hero.has_active_promotion ? hero.promotion?.label || "Promoção" : hero.featured_label || "Destaque da casa"}
                  </span>
                </div>
              )}
              <h1 style={{ margin: 0, font: `600 clamp(24px,7.4vw,30px)/1.14 ${F.head}`, letterSpacing: "-.015em", textWrap: "balance", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {hero.title}
              </h1>
              {hero.description && (
                <p style={{ margin: "8px 0 0", font: `400 13.5px/1.45 ${F.body}`, color: "rgba(247,242,237,.72)", maxWidth: 330, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {hero.description}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 15 }}>
                <button
                  type="button"
                  onClick={() => openProduct(hero)}
                  {...cardIntent(hero)}
                  data-testid={`featured-product-${hero.id}`}
                  style={{ flex: 1, minWidth: 0, height: 50, border: "none", borderRadius: 99, background: C.brasa, color: "#160C06", font: `600 14.5px/1 ${F.body}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, cursor: "pointer", boxShadow: "0 10px 26px rgba(255,106,40,.28)" }}
                >
                  <IconPlay size={12} color="#160C06" /> Assistir o prato
                </button>
                <div style={{ height: 50, flex: "none", padding: "0 15px", borderRadius: 99, border: "1px solid rgba(255,236,222,.16)", background: "rgba(11,9,8,.55)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center" }}>
                  <Price item={hero} size="md" />
                </div>
              </div>
            </div>
          )}
        </div>

        {data.reservations?.enabled && (
          <div style={{ padding: "4px 16px 2px" }}>
            <button
              type="button"
              onClick={() => setReservationOpen(true)}
              data-testid="open-reservation-btn"
              style={{ width: "100%", minHeight: 54, border: "1px solid rgba(95,208,138,.3)", borderRadius: 17, background: "linear-gradient(135deg,rgba(95,208,138,.16),rgba(95,208,138,.07))", color: "#D9FFE7", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, font: `600 13.5px/1 ${F.body}`, cursor: "pointer" }}
            >
              <i className="fas fa-calendar-check" /> Fazer uma reserva
            </button>
          </div>
        )}

        {/* ── STORIES: pratos destacados pelo restaurante ── */}
        {stories.length > 0 && (
          <div style={{ padding: "18px 0 4px" }} data-testid="menu-stories">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "0 16px 12px" }}>
              <span style={{ font: `600 10px/1 ${F.body}`, letterSpacing: ".15em", textTransform: "uppercase", color: C.brasaSoft }}>Destaques da casa</span>
              <span style={{ font: `500 10px/1 ${F.body}`, letterSpacing: ".1em", color: "rgba(247,242,237,.32)" }}>{String(stories.length).padStart(2, "0")}</span>
            </div>
            <div className="pmScroll" style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 16px 2px" }}>
              {stories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openProduct(item)}
                  {...cardIntent(item)}
                  style={{ flex: "none", width: 74, background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "inherit" }}
                >
                  <span style={{ width: 70, height: 70, borderRadius: 99, padding: 2.5, border: `1.8px solid ${C.brasa}`, flex: "none" }}>
                    <span style={{ display: "block", width: "100%", height: "100%", borderRadius: 99, overflow: "hidden", background: "repeating-linear-gradient(135deg,#191310 0 5px,#221913 5px 10px)" }}>
                      {item.image_url && <img src={mediaUrl(item.image_url)} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                    </span>
                  </span>
                  <span style={{ font: `500 10.5px/1.25 ${F.body}`, color: "rgba(247,242,237,.72)", textAlign: "center", width: "100%", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── BUSCA ── */}
        <div style={{ padding: "14px 16px 0" }}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setParams({ r: restaurant.slug, q: new FormData(event.currentTarget).get("q"), cat: query.cat || "" });
            }}
            style={{ display: "flex", alignItems: "center", height: 48, borderRadius: 99, background: C.card, border: `1px solid ${C.border}`, padding: "0 16px", gap: 10 }}
          >
            <IconSearch />
            <input
              name="q"
              defaultValue={query.q}
              placeholder="Buscar pratos…"
              data-testid="menu-search-input"
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: C.creme, font: `400 14px/1 ${F.body}` }}
            />
          </form>
        </div>

        {/* ── CATEGORIAS ── */}
        <div className="pmScroll" data-testid="menu-categories" style={{ display: "flex", gap: 7, overflowX: "auto", padding: "12px 16px 0" }}>
          {[{ id: 0, name: "Todos" }, ...data.categories].map((category) => {
            const active = category.id ? query.cat === category.id : !query.cat;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setParams(category.id ? { r: restaurant.slug, q: query.q, cat: category.id } : { r: restaurant.slug, q: query.q })}
                style={{
                  flex: "none",
                  height: 44,
                  padding: "0 16px",
                  borderRadius: 99,
                  border: active ? "1px solid rgba(255,106,40,.55)" : `1px solid ${C.border}`,
                  background: active ? "rgba(255,106,40,.14)" : C.card,
                  color: active ? C.brasaPale : "rgba(247,242,237,.74)",
                  font: `${active ? 600 : 500} 13px/1 ${F.body}`,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {/* ── ESTABELECIMENTOS ── */}
        {establishments.length > 0 && (
          <div className="pmScroll" data-testid="menu-establishments" style={{ display: "flex", gap: 7, overflowX: "auto", padding: "8px 16px 0" }}>
            {[{ id: 0, name: "Todos os locais" }, ...establishments].map((est) => {
              const active = est.id ? Number(params.get("est")) === est.id : !params.get("est");
              return (
                <button
                  key={est.id}
                  type="button"
                  onClick={() =>
                    setParams(
                      est.id
                        ? { r: restaurant.slug, q: query.q, cat: query.cat || "", est: est.id }
                        : { r: restaurant.slug, q: query.q, cat: query.cat || "" },
                    )
                  }
                  style={{
                    flex: "none",
                    height: 38,
                    padding: "0 14px",
                    borderRadius: 99,
                    border: active ? "1px solid rgba(240,178,74,.45)" : `1px solid ${C.border}`,
                    background: active ? "rgba(240,178,74,.12)" : C.card,
                    color: active ? C.dourado : "rgba(247,242,237,.68)",
                    font: `${active ? 600 : 500} 12px/1 ${F.body}`,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <i className="fas fa-store" style={{ fontSize: 10 }} />
                  {est.name}
                </button>
              );
            })}
          </div>
        )}

        {reviewNotice && (
          <div role="status" style={{ margin: "14px 16px 0", padding: "13px 16px", borderRadius: 14, background: "rgba(95,208,138,.08)", border: "1px solid rgba(95,208,138,.22)", font: `400 12.5px/1.45 ${F.body}`, color: C.verde }}>
            {reviewNotice}
          </div>
        )}

        {/* ── PROMOÇÕES ── */}
        {promoted.length > 0 && (
          <div style={{ padding: "18px 16px 0" }}>
            <Divider />
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, margin: "5px 0 12px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 9, minWidth: 0 }}>
                <h3 style={{ margin: 0, font: `600 15.5px/1.1 ${F.head}`, letterSpacing: "-.01em" }}>Promoções</h3>
                <span style={{ font: `500 10px/1 ${F.body}`, letterSpacing: ".1em", color: "rgba(247,242,237,.32)" }}>{String(promoted.length).padStart(2, "0")}</span>
              </div>
              <button
                type="button"
                onClick={() => openProduct(promoted[0])}
                style={{ flex: "none", height: 32, padding: "0 12px", borderRadius: 99, border: `1px solid rgba(255,236,222,.14)`, background: "transparent", color: "rgba(247,242,237,.8)", font: `500 12px/1 ${F.body}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                Ver todos <Caret />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9 }}>
              {promoted.map((item) => (
                <ProductTile key={item.id} item={item} intent={cardIntent(item)} onOpen={openProduct} />
              ))}
            </div>
          </div>
        )}

        {/* ── CATEGORIAS / PRATOS ── */}
        {groups.map(({ category, products }, index) => (
          <div key={category.id} style={{ padding: "18px 16px 0" }}>
            {(index > 0 || promoted.length > 0) && <Divider />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "5px 0 12px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 9, minWidth: 0 }}>
                <h3 style={{ margin: 0, font: `600 15.5px/1.1 ${F.head}`, letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{category.name}</h3>
                <span style={{ font: `500 10px/1 ${F.body}`, letterSpacing: ".1em", color: "rgba(247,242,237,.32)", flex: "none" }}>{String(products.length).padStart(2, "0")}</span>
              </div>
              <button
                type="button"
                onClick={() => openCategoryFeed(feedCats.findIndex((group) => group.id === category.id))}
                style={{ flex: "none", height: 32, padding: "0 12px", borderRadius: 99, border: `1px solid rgba(255,236,222,.14)`, background: "transparent", color: "rgba(247,242,237,.8)", font: `500 12px/1 ${F.body}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                Ver todos <Caret />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9 }}>
              {products.slice(0, FEED_LIMIT).map((item) => (
                <ProductTile key={item.id} item={item} intent={cardIntent(item)} onOpen={openProduct} />
              ))}
            </div>
          </div>
        ))}

        {!allProducts.length && (
          <div style={{ padding: "60px 16px", textAlign: "center", font: `400 13px/1.6 ${F.body}`, color: C.faint }}>Nenhum prato encontrado.</div>
        )}

        {/* ── AVALIAÇÕES ── */}
        <div style={{ padding: "28px 16px 0" }}>
          <button
            type="button"
            onClick={() => setReviewsOpen(true)}
            data-testid="open-reviews-btn"
            style={{ width: "100%", border: `1px solid rgba(255,236,222,.1)`, background: C.card, borderRadius: 18, padding: "16px 17px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left", color: "inherit" }}
          >
            <span style={{ font: `400 22px/1 ${F.body}`, color: C.dourado, flex: "none" }}>★</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", font: `600 13px/1.2 ${F.body}` }}>Avaliações do restaurante</span>
              <span style={{ display: "block", font: `400 11.5px/1.3 ${F.body}`, color: C.muted, marginTop: 3 }}>
                {summary?.total ? `${(summary.avg_rating || 0).toFixed(1).replace(".", ",")} de 5 em ${summary.total} avaliações` : "Seja o primeiro a avaliar"}
              </span>
            </span>
            <span style={{ width: 32, height: 32, flex: "none", borderRadius: 99, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Caret color="rgba(247,242,237,.7)" size={6} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            style={{ display: "block", width: "100%", marginTop: 20, background: "none", border: "none", cursor: "pointer", textAlign: "center", font: `400 11.5px/1.75 ${F.body}`, color: "rgba(247,242,237,.34)" }}
          >
            {settings.store_name}
            {settings.address ? <><br />{settings.address}</> : null}
            {settings.hours ? <><br />{settings.hours}</> : null}
          </button>
        </div>

        <div style={{ borderTop: `1px solid rgba(255,236,222,.07)`, marginTop: 26 }}>
          <PlaymenuFooter />
        </div>
        <div style={{ height: listCount > 0 ? 96 : 24 }} />
      </div>

      {/* ── BOTÃO FLUTUANTE DA LISTA (fixo em qualquer página) ── */}
      {listCount > 0 && !anyLayer && (
        <button
          type="button"
          onClick={() => setListOpen(true)}
          aria-label="Ver minha lista"
          data-testid="open-list-btn"
          style={{
            position: "fixed",
            right: "max(16px,calc(50vw - 264px))",
            bottom: "calc(20px + env(safe-area-inset-bottom))",
            zIndex: 180,
            height: 58,
            padding: "0 20px 0 16px",
            borderRadius: 99,
            border: "none",
            background: C.brasa,
            boxShadow: "0 14px 34px rgba(255,106,40,.4)",
            display: "flex",
            alignItems: "center",
            gap: 9,
            cursor: "pointer",
          }}
        >
          <IconComanda size={24} color="#160C06" />
          <span style={{ font: `600 14px/1 ${F.body}`, color: "#160C06" }}>Lista · {listCount}</span>
        </button>
      )}

      {/* ── CAMADAS ── */}
      {viewer && (
        <VideoFeed
          items={viewer.items}
          index={viewer.index}
          onIndex={(i) => setViewer((v) => ({ ...v, index: i }))}
          catName={feedCats[viewer.cat]?.name || ""}
          catIndex={viewer.cat}
          catCount={feedCats.length}
          onCat={stepCategory}
          onClose={() => setViewer(null)}
          onDetail={openDetail}
          onAdd={addToList}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          listCount={listCount}
          onOpenList={() => setListOpen(true)}
          coach={coach}
          onCoachDone={finishCoach}
          paused={!!detail || listOpen || waiterOpen || reviewsOpen || profileOpen}
        />
      )}

      {detail && (
        <DetailSheet
          item={detail}
          pairs={pairsFor(detail)}
          onOpenPair={(it) => {
            setDetail(null);
            openProduct(it);
          }}
          onClose={() => setDetail(null)}
          onAdd={addToList}
        />
      )}

      {reservationOpen && (
        <ReservationModal
          restaurantSlug={restaurant.slug}
          storeName={settings.store_name}
          onClose={() => setReservationOpen(false)}
        />
      )}

      {profileOpen && (
        <ProfileModal
          settings={settings}
          restaurant={restaurant}
          establishments={establishments}
          logo={logo}
          cover={cover || heroMedia}
          extraLinks={extraLinks}
          onClose={() => setProfileOpen(false)}
          onTrack={trackLink}
        />
      )}

      {listOpen && (
        <ListPanel
          entries={listEntries}
          total={listTotal}
          storeName={settings.store_name}
          onClose={() => setListOpen(false)}
          onQty={changeQty}
          onShowWaiter={() => setWaiterOpen(true)}
        />
      )}

      {waiterOpen && <WaiterCard entries={listEntries} total={listTotal} storeName={settings.store_name} onClose={() => setWaiterOpen(false)} />}

      {reviewsOpen && (
        <ReviewsSheet
          reviews={reviews}
          summary={summary}
          rating={rating}
          setRating={setRating}
          onSubmit={submitReview}
          notice={reviewNotice}
          onClose={() => setReviewsOpen(false)}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", left: 20, right: 20, bottom: "calc(96px + env(safe-area-inset-bottom))", zIndex: 400, pointerEvents: "none", display: "flex", justifyContent: "center", animation: "pmToast 2.2s ease forwards" }}>
          <div style={{ maxWidth: MAXW - 40, background: C.creme, color: C.base, borderRadius: 99, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 14px 34px rgba(0,0,0,.45)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: C.carvao, flex: "none" }} />
            <span style={{ font: `600 13px/1.2 ${F.body}` }}>{toast}</span>
          </div>
        </div>
      )}

      {/* buffer antecipado do vídeo */}
      {warmUrl && !viewer && (
        <video className="pmWarmVideo" src={mediaUrl(warmUrl)} preload="auto" muted playsInline aria-hidden="true" tabIndex={-1} style={{ display: "none" }} />
      )}
    </div>
  );
}
