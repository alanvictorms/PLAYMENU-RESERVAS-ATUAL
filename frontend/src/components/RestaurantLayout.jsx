import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { useLegacyStyles } from "../hooks/useLegacyStyles";
import { LegacyIcon } from "./LegacyIcon";

const menu = [
  ["dashboard", "fa-chart-pie", "Dashboard", "/admin"],
  ["metrics", "fa-chart-line", "Métricas", "/admin/metricas"],
  ["products", "fa-utensils", "Produtos", "/admin/produtos"],
  [
    "menu-import",
    "fa-wand-magic-sparkles",
    "Importar cardápio com IA",
    "/admin/importar-cardapio",
  ],
  ["establishments", "fa-store", "Estabelecimentos", "/admin/estabelecimentos"],
  ["video", "fa-video", "Solicitar Vídeo", "/admin/videos"],
  ["bookings", "fa-calendar-check", "Reservas e fila", "/admin/reservas"],
  ["gallery", "fa-photo-film", "Galeria", "/admin/galeria"],
  ["reviews", "fa-star", "Avaliações", "/admin/avaliacoes"],
  ["bio", "fa-link", "Link-in-Bio", "/admin/link-in-bio"],
  ["settings", "fa-gear", "Configurações", "/admin/configuracoes"],
  [
    "subscription",
    "fa-credit-card",
    "Assinaturas",
    "/admin/assinatura",
  ],
  ["qr-kit", "fa-qrcode", "Materiais com QR Code", "/admin/qr-code"],
  ["profile", "fa-user", "Perfil", "/admin/perfil"],
];

export const RestaurantLayout = () => {
  useLegacyStyles(
    "/public/assets/css/playmenu-ui.css",
    "ui-kit-page restaurant-admin-page"
  );

  const [open, setOpen] = useState(false);
  const [navTooltip, setNavTooltip] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarRef = useRef(null);

  /**
   * Centraliza um item dentro do menu com scroll.
   *
   * @param {HTMLElement} menuItem Elemento do menu que será aproximado.
   * @param {"auto" | "smooth"} behavior Tipo de animação do scroll.
   */
  const scrollNavItemIntoView = useCallback(
    (menuItem, behavior = "smooth") => {
      const sidebar = sidebarRef.current;
      const nav = sidebar?.querySelector(".sidebar__nav");

      if (!nav || !menuItem) {
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const itemRect = menuItem.getBoundingClientRect();

      /*
       * Posição atual do item em relação ao conteúdo rolável do NAV.
       * Usar getBoundingClientRect evita problemas caso o offsetParent
       * do botão não seja diretamente o NAV.
       */
      const itemTopInsideNav =
        nav.scrollTop + itemRect.top - navRect.top;

      /*
       * Centraliza o item verticalmente dentro da área visível.
       */
      const desiredScrollTop =
        itemTopInsideNav -
        nav.clientHeight / 2 +
        itemRect.height / 2;

      /*
       * Impede que o navegador tente ultrapassar os limites do scroll.
       */
      const maximumScrollTop = Math.max(
        0,
        nav.scrollHeight - nav.clientHeight
      );

      const finalScrollTop = Math.min(
        maximumScrollTop,
        Math.max(0, desiredScrollTop)
      );

      nav.scrollTo({
        top: finalScrollTop,
        behavior,
      });
    },
    []
  );

  const showNavTooltip = (event, label) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setNavTooltip({
      label,
      left: rect.right + 13,
      top: rect.top + rect.height / 2,
    });
  };

  const handleMenuClick = (event) => {
    const clickedItem = event.currentTarget;

    setNavTooltip(null);

    /*
     * Faz o scroll imediatamente no item selecionado.
     */
    scrollNavItemIntoView(clickedItem, "smooth");

    /*
     * Fecha o menu lateral em dispositivos móveis.
     */
    setOpen(false);
  };

  useLayoutEffect(() => {
    const sidebar = sidebarRef.current;

    if (!sidebar) {
      return undefined;
    }

    let frame = 0;

    const updateClip = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const active = sidebar.querySelector(
          '.nav-btn.active, .nav-btn[aria-current="page"]'
        );

        const width = sidebar.offsetWidth;
        const height = sidebar.offsetHeight;

        if (!active || !width || !height) {
          sidebar.style.removeProperty("--sidebar-clip");
          return;
        }

        const sidebarRect = sidebar.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();

        const centerY =
          activeRect.top +
          activeRect.height / 2 -
          sidebarRect.top;

        const centerX =
          activeRect.left +
          activeRect.width / 2 -
          sidebarRect.left;

        const cutoutRadius = 50;
        const cornerRadius = 28;

        const deltaX =
          width - cornerRadius - centerX;

        const distance =
          cutoutRadius + cornerRadius;

        const deltaY = Math.sqrt(
          Math.max(
            distance * distance - deltaX * deltaX,
            0
          )
        );

        const tangentX =
          centerX +
          (deltaX * cutoutRadius) / distance;

        const tangentY =
          (deltaY * cutoutRadius) / distance;

        const round = (number) =>
          Math.round(number * 100) / 100;

        const path = `
          M0,0
          H${width - 40}
          A40,40 0 0 1 ${width},40
          V${round(centerY - deltaY)}
          A${cornerRadius},${cornerRadius}
          0 0 1
          ${round(tangentX)},${round(centerY - tangentY)}
          A${cutoutRadius},${cutoutRadius}
          0 1 0
          ${round(tangentX)},${round(centerY + tangentY)}
          A${cornerRadius},${cornerRadius}
          0 0 1
          ${width},${round(centerY + deltaY)}
          V${height - 40}
          A40,40 0 0 1
          ${width - 40},${height}
          H0
          Z
        `
          .replace(/\s+/g, " ")
          .trim();

        sidebar.style.setProperty(
          "--sidebar-clip",
          `path("${path}")`
        );
      });
    };

    const nav = sidebar.querySelector(".sidebar__nav");

    const active = sidebar.querySelector(
      '.sidebar__nav .nav-btn.active, .sidebar__nav .nav-btn[aria-current="page"]'
    );

    /**
     * Ao entrar diretamente em uma rota, atualizar a página
     * ou navegar pelo código, aproxima o item ativo.
     */
    const revealActive = () => {
      if (!nav || !active) {
        return;
      }

      scrollNavItemIntoView(active, "smooth");
    };

    const handleNavScroll = () => {
      setNavTooltip(null);
      updateClip();
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            updateClip();
          });

    resizeObserver?.observe(sidebar);

    if (nav) {
      resizeObserver?.observe(nav);
    }

    if (active) {
      resizeObserver?.observe(active);
    }

    nav?.addEventListener(
      "scroll",
      handleNavScroll,
      { passive: true }
    );

    window.addEventListener("resize", updateClip);

    /*
     * Aguarda o React aplicar a classe active no NavLink.
     */
    requestAnimationFrame(() => {
      revealActive();
      updateClip();
    });

    /*
     * Recalcula depois que as fontes e ícones terminarem
     * de carregar.
     */
    document.fonts?.ready.then(() => {
      revealActive();
      updateClip();
    });

    return () => {
      cancelAnimationFrame(frame);

      resizeObserver?.disconnect();

      nav?.removeEventListener(
        "scroll",
        handleNavScroll
      );

      window.removeEventListener(
        "resize",
        updateClip
      );
    };
  }, [location.pathname, scrollNavItemIntoView]);

  return (
    <>
      <header className="mobile-topbar">
        <button
          type="button"
          className="hamburger"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label={
            open
              ? "Fechar menu de navegação"
              : "Abrir menu de navegação"
          }
        >
          <LegacyIcon name="fa-bars" />
        </button>
      </header>

      <div
        className={`sidebar-overlay ${
          open ? "visible" : ""
        }`}
        onClick={() => setOpen(false)}
      />

      <div className="app">
        <aside
          ref={sidebarRef}
          className={`sidebar ${open ? "open" : ""}`}
          id="restaurant-sidebar"
        >
          <NavLink
            className="sidebar__brand"
            to="/admin"
            onClick={() => setOpen(false)}
          >
            <span className="sidebar__logo">
              <img
                src="/public/assets/images/logopm.png"
                alt="Play Menu"
              />
            </span>
          </NavLink>

          <nav
            className="sidebar__nav"
            aria-label="Navegação do restaurante"
          >
            {menu.map(
              ([key, icon, label, url]) => (
                <NavLink
                  key={key}
                  to={url}
                  end={url === "/admin"}
                  className={({ isActive }) =>
                    `nav-btn ${
                      isActive ? "active" : ""
                    }`
                  }
                  aria-label={label}
                  data-nav-label={label}
                  onMouseEnter={(event) =>
                    showNavTooltip(event, label)
                  }
                  onMouseLeave={() =>
                    setNavTooltip(null)
                  }
                  onFocus={(event) =>
                    showNavTooltip(event, label)
                  }
                  onBlur={() =>
                    setNavTooltip(null)
                  }
                  onClick={handleMenuClick}
                >
                  <LegacyIcon name={icon} />
                </NavLink>
              )
            )}
          </nav>

          <div className="sidebar__bottom">
            <div className="sidebar__divider" />

            <button
              type="button"
              className="nav-btn"
              title="Sair"
              aria-label="Sair"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LegacyIcon name="fa-right-from-bracket" />
            </button>
          </div>
        </aside>

        {navTooltip && (
          <div
            className="restaurant-sidebar-tooltip"
            role="tooltip"
            style={{
              left: navTooltip.left,
              top: navTooltip.top,
            }}
          >
            {navTooltip.label}
          </div>
        )}

        <main
          className="ui-kit-main restaurant-main"
          id="conteudo-principal"
        >
          <Outlet context={{ user }} />
        </main>
      </div>
    </>
  );
};

export const PageHeader = ({
  title,
  description,
  section = "Painel do restaurante",
}) => {
  const { user } = useAuth();

  const userName = user?.name || "Restaurante";
  const initial = userName
    .slice(0, 1)
    .toUpperCase();

  return (
    <header className="ui-page-header">
      <div className="ui-page-header__copy">
        <nav
          className="ui-breadcrumb"
          aria-label="Navegação estrutural"
        >
          <NavLink to="/admin">
            Painel
          </NavLink>

          <LegacyIcon name="fa-chevron-right" />

          <span>{section}</span>
        </nav>

        <h1 className="ui-page-title">
          {title}
        </h1>

        <p className="ui-page-description">
          {description}
        </p>
      </div>

      <div className="ui-account-chip">
        <span className="ui-account-chip__avatar">
          {initial}
        </span>

        <span className="ui-account-chip__copy">
          <strong>{userName}</strong>
          <small>Restaurante</small>
        </span>
      </div>
    </header>
  );
};

export const PageContent = ({ children }) => (
  <div className="ui-page-content">
    {children}
  </div>
);