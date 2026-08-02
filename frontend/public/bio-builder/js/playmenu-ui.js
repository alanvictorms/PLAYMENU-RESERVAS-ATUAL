(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Sidebar: recorte gravitacional no botão ativo ---------- */
  function updateSidebarClip() {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    var active = sidebar.querySelector('.nav-btn.active');
    var W = sidebar.offsetWidth;
    var H = sidebar.offsetHeight;

    if (!active || !W || !H) {
      sidebar.style.removeProperty('--sidebar-clip');
      return;
    }

    var sRect = sidebar.getBoundingClientRect();
    var bRect = active.getBoundingClientRect();
    var cy = bRect.top + bRect.height / 2 - sRect.top;
    var cx = bRect.left + bRect.width / 2 - sRect.left;
    var R = 50;
    var r = 28;
    var dx = W - r - cx;
    var d = R + r;
    var dy = Math.sqrt(Math.max(d * d - dx * dx, 0));
    var px = cx + (dx * R) / d;
    var py = (dy * R) / d;
    var f = function (n) { return Math.round(n * 100) / 100; };

    var p = 'M0,0 H' + (W - 40) +
      ' A40,40 0 0 1 ' + W + ',40' +
      ' V' + f(cy - dy) +
      ' A' + r + ',' + r + ' 0 0 1 ' + f(px) + ',' + f(cy - py) +
      ' A' + R + ',' + R + ' 0 1 0 ' + f(px) + ',' + f(cy + py) +
      ' A' + r + ',' + r + ' 0 0 1 ' + W + ',' + f(cy + dy) +
      ' V' + (H - 40) +
      ' A40,40 0 0 1 ' + (W - 40) + ',' + H +
      ' H0 Z';

    sidebar.style.setProperty('--sidebar-clip', 'path("' + p + '")');
  }

  updateSidebarClip();
  window.addEventListener('resize', updateSidebarClip);

  /* ---------- Menu mobile ---------- */
  var hamburger = $('.hamburger');
  var sidebar = $('.sidebar');
  var overlay = $('.sidebar-overlay');

  function setSidebarState(open) {
    if (!sidebar) return;

    sidebar.classList.toggle('open', open);

    if (overlay) overlay.classList.toggle('visible', open);

    if (hamburger) {
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    }

    document.body.classList.toggle('sidebar-mobile-open', open);

    if (open) {
      requestAnimationFrame(function () {
        updateSidebarClip();
      });
    }
  }

  function closeSidebar() {
    setSidebarState(false);
  }

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', function () {
      var isOpen = sidebar.classList.contains('open');
      setSidebarState(!isOpen);
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSidebar();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 860 && sidebar && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  /* ---------- Toast simples ---------- */
  function ensureStack() {
    var stack = $('.pm-toast-stack');

    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'pm-toast-stack';
      document.body.appendChild(stack);
    }

    return stack;
  }

  window.pmToast = function (msg) {
    var stack = ensureStack();
    var el = document.createElement('div');

    el.className = 'pm-toast';
    el.textContent = msg;
    stack.appendChild(el);

    setTimeout(function () {
      el.remove();
    }, 2800);
  };

  /* ---------- Documentação: Visualização / HTML + Copiar ---------- */
  function dedent(html) {
    var lines = html.replace(/^\n+|\s+$/g, '').split('\n');
    var indents = lines.filter(function (l) {
      return l.trim();
    }).map(function (l) {
      return l.match(/^\s*/)[0].length;
    });

    var min = indents.length ? Math.min.apply(null, indents) : 0;

    return lines.map(function (l) {
      return l.slice(min);
    }).join('\n');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  $$('[data-pm-demo]').forEach(function (demo) {
    var preview = demo.querySelector('[data-pm-preview]');
    var codeWrap = demo.querySelector('[data-pm-code]');
    var tabs = $$('[data-pm-view]', demo);
    var copyBtn = demo.querySelector('[data-pm-copy]');

    if (!preview) return;

    var source = dedent(preview.innerHTML);

    if (codeWrap) {
      var pre = document.createElement('pre');
      var code = document.createElement('code');

      code.innerHTML = escapeHtml(source);
      pre.appendChild(code);
      codeWrap.appendChild(pre);
    }

    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });

        var view = btn.getAttribute('data-pm-view');

        preview.hidden = view !== 'preview';

        if (codeWrap) codeWrap.hidden = view !== 'code';
      });
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        (navigator.clipboard ? navigator.clipboard.writeText(source) : Promise.reject()).then(function () {
          copyBtn.classList.add('is-copied');

          var original = copyBtn.textContent;

          copyBtn.textContent = 'Copiado!';
          window.pmToast('HTML copiado para a área de transferência.');

          setTimeout(function () {
            copyBtn.classList.remove('is-copied');
            copyBtn.textContent = original;
          }, 1600);
        }).catch(function () {
          window.pmToast('Não foi possível copiar automaticamente.');
        });
      });
    }
  });

  /* ---------- Anchor nav: estado ativo por scroll ---------- */
  var anchorNav = $('.pm-anchor-nav');

  if (anchorNav && 'IntersectionObserver' in window) {
    var links = $$('a[href^="#"]', anchorNav);
    var map = {};

    links.forEach(function (l) {
      map[l.getAttribute('href').slice(1)] = l;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && map[entry.target.id]) {
          links.forEach(function (l) {
            l.classList.remove('is-active');
          });

          map[entry.target.id].classList.add('is-active');
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px'
    });

    Object.keys(map).forEach(function (id) {
      var section = document.getElementById(id);

      if (section) observer.observe(section);
    });
  }

  /* ---------- Bootstrap: inicializa tooltips e popovers ---------- */
  if (window.bootstrap) {
    $$('[data-bs-toggle="tooltip"]').forEach(function (el) {
      new window.bootstrap.Tooltip(el);
    });

    $$('[data-bs-toggle="popover"]').forEach(function (el) {
      new window.bootstrap.Popover(el);
    });
  }
})();

 function aplicarMicroZoom() {
  const elemento = document.documentElement;
  const zoomOriginal = elemento.style.zoom;

  // Aumenta exatamente 0,01%
  elemento.style.zoom = "100.01%";

  // Aguarda dois frames para o navegador renderizar a alteração
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elemento.style.zoom = zoomOriginal;
    });
  });
}

// Executa assim que toda a página terminar de carregar
if (document.readyState === "complete") {
  aplicarMicroZoom();
} else {
  window.addEventListener("load", aplicarMicroZoom, { once: true });
}