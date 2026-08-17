import { useInsertionEffect } from "react";

/**
 * As páginas legadas dependem de folhas de estilo servidas de /public. Antes elas
 * eram injetadas dentro de um useEffect, ou seja, depois da primeira pintura — o
 * navegador chegava a desenhar a tela inteira sem estilo nenhum antes do CSS chegar.
 *
 * Agora a injeção acontece em useInsertionEffect (antes da pintura), o documento
 * ganha a classe `pm-css-pending` enquanto houver folha carregando (o index.html
 * usa essa classe para segurar o #root e mostrar o splash) e os <link> nunca são
 * removidos: ao sair da página eles apenas ficam desativados, de modo que voltar
 * para ela reaplica o estilo instantaneamente, sem novo download nem reparse.
 */

const stylesheets = new Map();
const bodyClassRegistry = new Map();
const root = document.documentElement;
const MAX_BLOCKING_MS = 3000;

let pending = 0;

const markPending = (delta) => {
  pending = Math.max(0, pending + delta);
  root.classList.toggle("pm-css-pending", pending > 0);
};

const ensureStylesheet = (href) => {
  const existing = stylesheets.get(href);
  if (existing) {
    existing.refs += 1;
    if (existing.link.disabled) existing.link.disabled = false;
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.playmenuStyle = "true";

  const entry = { link, loaded: false, refs: 1 };
  stylesheets.set(href, entry);
  markPending(1);

  const settle = () => {
    if (entry.loaded) return;
    entry.loaded = true;
    markPending(-1);
    if (entry.refs <= 0) entry.link.disabled = true;
  };

  link.addEventListener("load", settle);
  link.addEventListener("error", settle);
  // Uma folha lenta nunca deve segurar a interface indefinidamente.
  setTimeout(settle, MAX_BLOCKING_MS);

  document.head.appendChild(link);
};

const releaseStylesheet = (href) => {
  const entry = stylesheets.get(href);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0 && entry.loaded) entry.link.disabled = true;
};

export const useLegacyStyles = (href, bodyClass = "") => {
  useInsertionEffect(() => {
    ensureStylesheet(href);

    const classes = bodyClass.split(/\s+/).filter(Boolean);
    classes.forEach((className) => {
      const current = bodyClassRegistry.get(className);
      if (current) {
        current.count += 1;
        return;
      }
      bodyClassRegistry.set(className, {
        count: 1,
        existedBefore: document.body.classList.contains(className),
      });
      document.body.classList.add(className);
    });

    return () => {
      releaseStylesheet(href);
      classes.forEach((className) => {
        const current = bodyClassRegistry.get(className);
        if (!current) return;
        current.count -= 1;
        if (current.count > 0) return;
        if (!current.existedBefore) document.body.classList.remove(className);
        bodyClassRegistry.delete(className);
      });
    };
  }, [href, bodyClass]);
};
