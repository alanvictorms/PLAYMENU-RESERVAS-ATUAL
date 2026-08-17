/**
 * Primeiros segmentos de URL que pertencem ao aplicativo e por isso nunca podem ser
 * confundidos com o slug público de um restaurante (playmenu.app/nome-do-restaurante).
 * O backend mantém a mesma lista em app_core.RESERVED_SLUGS ao gerar slugs novos.
 */
export const RESERVED_SLUGS = new Set([
  "admin", "api", "assets", "bio", "bio-builder", "cadastro", "cardapio",
  "favicon.ico", "fila", "gerente", "index.html", "login", "manifest.json", "public",
  "recuperar-senha", "representante", "robots.txt", "sair", "sitemap.xml",
  "static", "superadmin", "reserva", "validar-email",
]);

export const isReservedSlug = (value) => RESERVED_SLUGS.has(String(value || "").toLowerCase());
