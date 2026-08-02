import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, mediaUrl, money } from "../services/api";
import { useLegacyStyles } from "../hooks/useLegacyStyles";

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

const SWIPE_DISTANCE = 72;
const SLIDE_DURATION = 440;

export default function PublicMenu({ preview = false }) {
  useLegacyStyles("/public/assets/css/app.css", "public-menu-page");

  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewNotice, setReviewNotice] = useState("");
  const [viewerIdx, setViewerIdx] = useState(-1);
  const [incomingProduct, setIncomingProduct] = useState(null);
  const [slideDirection, setSlideDirection] = useState(1);
  const [slideActive, setSlideActive] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSwipeTutorial, setShowSwipeTutorial] = useState(false);

  const touchRef = useRef({ startX: 0, startY: 0, active: false });
  const navigationRequestRef = useRef(0);
  const navigationPendingRef = useRef(false);
  const transitionTimerRef = useRef(null);
  const tutorialTimerRef = useRef(null);
  const tutorialCheckedRef = useRef(false);
  const productCacheRef = useRef(new Map());

  const query = {
    r: params.get("r") || "",
    q: params.get("q") || "",
    cat: Number(params.get("cat") || 0),
    preview,
  };
  const queryKey = JSON.stringify(query);

  const load = () =>
    api
      .get("/public/menu", { params: JSON.parse(queryKey) })
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.detail || "Restaurante não encontrado.",
        ),
      );

  useEffect(() => {
    load();
  }, [queryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const featured = useMemo(
    () => (data?.products || []).filter((item) => item.is_featured),
    [data],
  );

  const groups = useMemo(() => {
    if (!data) return [];

    return data.categories
      .map((category) => ({
        category,
        products: data.products.filter(
          (item) => !item.is_featured && item.category_id === category.id,
        ),
      }))
      .filter((group) => group.products.length);
  }, [data]);

  const allProducts = useMemo(() => data?.products || [], [data]);

  const fetchProductByIndex = useCallback(
    async (index) => {
      if (index < 0 || index >= allProducts.length) return null;

      const productId = allProducts[index].id;
      if (productCacheRef.current.has(productId)) {
        return productCacheRef.current.get(productId);
      }

      const { data: item } = await api.get(`/public/product/${productId}`);
      productCacheRef.current.set(productId, item);
      return item;
    },
    [allProducts],
  );

  const preloadNeighbors = useCallback(
    (index) => {
      [index - 1, index + 1].forEach((neighborIndex) => {
        if (neighborIndex >= 0 && neighborIndex < allProducts.length) {
          fetchProductByIndex(neighborIndex).catch(() => {});
        }
      });
    },
    [allProducts.length, fetchProductByIndex],
  );

  const dismissSwipeTutorial = useCallback(() => {
    if (tutorialTimerRef.current) {
      window.clearTimeout(tutorialTimerRef.current);
      tutorialTimerRef.current = null;
    }
    setShowSwipeTutorial(false);
  }, []);

  const showTutorialOnFirstOpen = useCallback(() => {
    if (tutorialCheckedRef.current) return;
    tutorialCheckedRef.current = true;

    const tutorialKey = `playmenu:swipe-tutorial:v1:${query.r || "menu"}`;
    let hasSeenTutorial = false;

    try {
      hasSeenTutorial = window.localStorage.getItem(tutorialKey) === "seen";
      if (!hasSeenTutorial) {
        window.localStorage.setItem(tutorialKey, "seen");
      }
    } catch {
      // O tutorial ainda funciona quando o navegador bloqueia o localStorage.
    }

    if (!hasSeenTutorial) {
      setShowSwipeTutorial(true);
      tutorialTimerRef.current = window.setTimeout(
        dismissSwipeTutorial,
        5200,
      );
    }
  }, [dismissSwipeTutorial, query.r]);

  const openProduct = useCallback(
    async (id) => {
      const index = allProducts.findIndex((item) => item.id === id);
      if (index < 0) return;

      try {
        const item = await fetchProductByIndex(index);
        if (!item) return;

        setProduct(item);
        setViewerIdx(index);
        preloadNeighbors(index);
        showTutorialOnFirstOpen();
      } catch {
        // Mantém o cardápio aberto caso um produto específico falhe ao carregar.
      }
    },
    [allProducts, fetchProductByIndex, preloadNeighbors, showTutorialOnFirstOpen],
  );

  const closeProductViewer = useCallback(() => {
    navigationRequestRef.current += 1;
    navigationPendingRef.current = false;

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    dismissSwipeTutorial();
    setProduct(null);
    setIncomingProduct(null);
    setViewerIdx(-1);
    setSlideActive(false);
    setIsTransitioning(false);
  }, [dismissSwipeTutorial]);

  const goToProduct = useCallback(
    async (index) => {
      if (
        index < 0 ||
        index >= allProducts.length ||
        index === viewerIdx ||
        navigationPendingRef.current
      ) {
        return;
      }

      navigationPendingRef.current = true;
      const requestId = ++navigationRequestRef.current;
      const direction = index > viewerIdx ? 1 : -1;

      try {
        const nextProduct = await fetchProductByIndex(index);
        if (!nextProduct || requestId !== navigationRequestRef.current) return;

        setSlideDirection(direction);
        setIncomingProduct(nextProduct);
        setSlideActive(false);
        setIsTransitioning(true);

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => setSlideActive(true));
        });

        transitionTimerRef.current = window.setTimeout(() => {
          setProduct(nextProduct);
          setViewerIdx(index);
          setIncomingProduct(null);
          setSlideActive(false);
          setIsTransitioning(false);
          navigationPendingRef.current = false;
          transitionTimerRef.current = null;
          preloadNeighbors(index);
        }, SLIDE_DURATION);
      } catch {
        if (requestId === navigationRequestRef.current) {
          navigationPendingRef.current = false;
          setIsTransitioning(false);
        }
      }
    },
    [allProducts.length, fetchProductByIndex, preloadNeighbors, viewerIdx],
  );

  const onTouchStart = useCallback(
    (event) => {
      if (showSwipeTutorial || isTransitioning) return;

      const touch = event.touches[0];
      touchRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        active: true,
      };
    },
    [isTransitioning, showSwipeTutorial],
  );

  const onTouchEnd = useCallback(
    (event) => {
      if (!touchRef.current.active || showSwipeTutorial || isTransitioning) {
        touchRef.current.active = false;
        return;
      }

      const touch = event.changedTouches[0];
      const deltaY = touchRef.current.startY - touch.clientY;
      const deltaX = touchRef.current.startX - touch.clientX;
      touchRef.current.active = false;

      if (
        Math.abs(deltaY) >= SWIPE_DISTANCE &&
        Math.abs(deltaY) > Math.abs(deltaX) * 1.15
      ) {
        goToProduct(deltaY > 0 ? viewerIdx + 1 : viewerIdx - 1);
      }
    },
    [goToProduct, isTransitioning, showSwipeTutorial, viewerIdx],
  );

  const onWheel = useCallback(
    (event) => {
      if (showSwipeTutorial || isTransitioning || Math.abs(event.deltaY) < 36) {
        return;
      }

      event.preventDefault();
      goToProduct(event.deltaY > 0 ? viewerIdx + 1 : viewerIdx - 1);
    },
    [goToProduct, isTransitioning, showSwipeTutorial, viewerIdx],
  );

  useEffect(() => {
    if (!product) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeProductViewer();
      if (event.key === "ArrowUp") goToProduct(viewerIdx + 1);
      if (event.key === "ArrowDown") goToProduct(viewerIdx - 1);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeProductViewer, goToProduct, product, viewerIdx]);

  useEffect(
    () => () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
      if (tutorialTimerRef.current) {
        window.clearTimeout(tutorialTimerRef.current);
      }
    },
    [],
  );

  const trackLink = (linkType, linkLabel) =>
    api
      .post("/public/analytics", {
        event_type: "link_click",
        restaurant_id: data.restaurant.id,
        link_type: linkType,
        link_label: linkLabel,
      })
      .catch(() => {});

  const submitReview = async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));

    try {
      await api.post("/public/reviews", {
        ...form,
        rating,
        restaurant_id: data.restaurant.id,
      });
      setReviewNotice(
        "Obrigado pela avaliação. Ela será exibida depois da aprovação do restaurante.",
      );
      setReviewsOpen(false);
    } catch (requestError) {
      setReviewNotice(
        requestError.response?.data?.detail || "Não foi possível enviar.",
      );
    }
  };

  const renderViewerSlide = (item, position) => {
    if (!item) return null;

    let transform = "translate3d(0, 0, 0)";
    if (position === "current" && slideActive) {
      transform = `translate3d(0, ${slideDirection > 0 ? "-100%" : "100%"}, 0)`;
    }
    if (position === "incoming" && !slideActive) {
      transform = `translate3d(0, ${slideDirection > 0 ? "100%" : "-100%"}, 0)`;
    }

    return (
      <div
        className={`pmViewerSlide pmViewerSlide--${position}`}
        style={{ transform }}
        aria-hidden={position === "incoming" && !slideActive}
      >
        <div className="modalVideoWrap">
          {item.video_url ? (
            <video
              key={`${item.id}-video`}
              src={mediaUrl(item.video_url)}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : item.image_url ? (
            <img
              key={`${item.id}-image`}
              src={mediaUrl(item.image_url)}
              alt={item.title}
            />
          ) : (
            <div className="pmViewerMediaFallback" />
          )}
        </div>

        <div className="sheet">
          <div className="sheetTitle">{item.title}</div>
          <div className="sheetDescWrap">
            <p className="sheetDesc">{item.description}</p>
          </div>
          <div className="sheetBottom">
            <div className="sheetPrice">{item.price}</div>
            {item.ar_model_url && (
              <a
                className="arPlaceBtn"
                href={mediaUrl(item.ar_model_url)}
                target="_blank"
                rel="noreferrer"
              >
                <i className="fas fa-cube" /> 3D
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="emptyState" role="alert">
        {error}
      </div>
    );
  }

  if (!data) return <div className="emptyState">Carregando cardápio...</div>;

  const { restaurant, settings, reviews, reviews_summary: summary } = data;
  const logo = mediaUrl(settings.logo_image);
  const cover = mediaUrl(settings.cover_image);
  const extraLinks = Array.isArray(settings.social_links)
    ? settings.social_links
    : [];

  return (
    <>
      <style>{`
        .pmProductViewer {
          overflow: hidden !important;
          overscroll-behavior: contain;
          padding: 0 !important;
          touch-action: pan-x;
          user-select: none;
        }

        .pmViewerViewport {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #000;
        }

        .pmViewerSlide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000;
          transition: transform ${SLIDE_DURATION}ms cubic-bezier(.22, .72, .18, 1);
          will-change: transform;
          backface-visibility: hidden;
        }

        .pmViewerSlide .modalVideoWrap {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .pmViewerSlide .modalVideoWrap video,
        .pmViewerSlide .modalVideoWrap img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pmViewerMediaFallback {
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #252525, #050505 70%);
        }

        .pmProductViewer .modalCloseBtn {
          position: absolute;
          z-index: 40;
        }

        .pmViewerPosition {
          position: absolute;
          top: max(16px, env(safe-area-inset-top));
          left: 50%;
          z-index: 35;
          transform: translateX(-50%);
          border-radius: 999px;
          padding: 5px 10px;
          color: rgba(255, 255, 255, .72);
          background: rgba(0, 0, 0, .28);
          backdrop-filter: blur(8px);
          font-size: 11px;
          line-height: 1;
          pointer-events: none;
        }

        .pmSwipeTutorial {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          color: #fff;
          background: rgba(0, 0, 0, .82);
          backdrop-filter: blur(8px);
          animation: pmTutorialFadeIn .25s ease both;
        }

        .pmSwipeTutorialContent {
          display: flex;
          width: min(100%, 360px);
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .pmSwipeTutorialContent h2 {
          margin: 0 0 8px;
          color: #fff;
          font-size: clamp(23px, 7vw, 30px);
          font-weight: 800;
          letter-spacing: -.03em;
        }

        .pmSwipeTutorialContent > p {
          margin: 0;
          max-width: 310px;
          color: rgba(255, 255, 255, .72);
          font-size: 14px;
          line-height: 1.5;
        }

        .pmSwipeGesture {
          position: relative;
          width: 120px;
          height: 220px;
          margin: 18px 0 10px;
        }

        .pmSwipeGesture::before {
          content: "";
          position: absolute;
          top: 24px;
          bottom: 24px;
          left: 50%;
          width: 2px;
          transform: translateX(-50%);
          background: linear-gradient(transparent, rgba(255,255,255,.48), transparent);
        }

        .pmSwipeArrow {
          position: absolute;
          left: 50%;
          color: rgba(255, 255, 255, .72);
          font-size: 24px;
          transform: translateX(-50%);
        }

        .pmSwipeArrow--up { top: 0; }
        .pmSwipeArrow--down { bottom: 0; }

        .pmSwipeHand {
          position: absolute;
          top: 82px;
          left: 50%;
          display: grid;
          width: 64px;
          height: 64px;
          place-items: center;
          transform: translateX(-50%);
          border: 1px solid rgba(255, 255, 255, .28);
          border-radius: 50%;
          background: rgba(255, 255, 255, .12);
          box-shadow: 0 12px 35px rgba(0, 0, 0, .3);
          font-size: 34px;
          animation: pmSwipeHand 2.35s cubic-bezier(.45, 0, .25, 1) infinite;
        }

        .pmSwipeLabels {
          display: grid;
          width: 100%;
          grid-template-columns: 1fr 1px 1fr;
          gap: 18px;
          align-items: center;
          margin-bottom: 24px;
        }

        .pmSwipeLabels span {
          display: flex;
          flex-direction: column;
          gap: 3px;
          color: rgba(255, 255, 255, .68);
          font-size: 12px;
        }

        .pmSwipeLabels strong {
          color: #fff;
          font-size: 14px;
        }

        .pmSwipeLabels i {
          width: 1px;
          height: 36px;
          background: rgba(255, 255, 255, .18);
        }

        .pmTutorialButton {
          min-width: 150px;
          border: 1px solid rgba(255, 255, 255, .34);
          border-radius: 999px;
          padding: 12px 22px;
          color: #fff;
          background: rgba(255, 255, 255, .12);
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        @keyframes pmSwipeHand {
          0%, 100% { transform: translate3d(-50%, 42px, 0); }
          38% { transform: translate3d(-50%, -42px, 0); }
          50% { transform: translate3d(-50%, -42px, 0); }
          88% { transform: translate3d(-50%, 42px, 0); }
        }

        @keyframes pmTutorialFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pmViewerSlide { transition-duration: 1ms; }
          .pmSwipeHand { animation: none; }
          .pmSwipeTutorial { animation: none; }
        }
      `}</style>

      {params.get("from") === "admin" && (
        <Link
          to="/admin/"
          className="public-back-link"
          data-testid="back-to-admin"
        >
          Voltar ao painel
        </Link>
      )}

      <div className="hero" data-testid="menu-hero">
        <div
          className="cover"
          style={{
            backgroundImage: cover
              ? `url(${cover})`
              : "linear-gradient(180deg,#222,#000)",
          }}
        />
        <div className="heroContent">
          <div className="logoBox">
            {logo ? (
              <img src={logo} alt="Logo" />
            ) : (
              <span style={{ fontSize: 14, fontWeight: 800, color: "#888" }}>
                LOGO
              </span>
            )}
          </div>
          <div className="storeTitle">{settings.store_name}</div>
          <p className="storeTag">{settings.tagline}</p>
          <div className="socialIcons">
            {settings.instagram && (
              <a
                className="socialIcon"
                href={`https://instagram.com/${String(settings.instagram).replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackLink("instagram", "Instagram")}
                aria-label="Instagram"
              >
                <i className="fab fa-instagram" />
              </a>
            )}
            {settings.whatsapp && (
              <a
                className="socialIcon"
                href={`https://wa.me/55${String(settings.whatsapp).replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackLink("whatsapp", "WhatsApp")}
                aria-label="WhatsApp"
              >
                <i className="fab fa-whatsapp" />
              </a>
            )}
            {extraLinks.map((link, index) => (
              <a
                key={index}
                className="socialIcon"
                href={link.url}
                target="_blank"
                rel="noreferrer"
                title={link.name}
                onClick={() => trackLink(link.type || "other", link.name)}
              >
                <i className={link.icon || "fas fa-link"} />
              </a>
            ))}
          </div>
          <div className="steps">
            Assista <span className="dot">•</span> Escolha{" "}
            <span className="dot">•</span> Peça
          </div>
        </div>
      </div>

      <div className="container" data-testid="menu-container">
        <div className="searchWrap">
          <svg className="searchIcon" viewBox="0 0 24 24">
            <circle
              cx="10"
              cy="10"
              r="7"
              stroke="currentColor"
              fill="none"
            />
            <path d="m16 16 5 5" stroke="currentColor" />
          </svg>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setParams({
                r: restaurant.slug,
                q: new FormData(event.currentTarget).get("q"),
                cat: query.cat || "",
              });
            }}
          >
            <input
              className="search"
              name="q"
              defaultValue={query.q}
              placeholder="Buscar pratos..."
              data-testid="menu-search-input"
            />
          </form>
        </div>

        <div className="chips" data-testid="menu-categories">
          <button
            className={`chip ${!query.cat ? "active" : ""}`}
            onClick={() => setParams({ r: restaurant.slug, q: query.q })}
          >
            Todos
          </button>
          {data.categories.map((category) => (
            <button
              key={category.id}
              className={`chip ${query.cat === category.id ? "active" : ""}`}
              onClick={() =>
                setParams({
                  r: restaurant.slug,
                  q: query.q,
                  cat: category.id,
                })
              }
            >
              {category.name.toUpperCase()}
            </button>
          ))}
        </div>

        {reviewNotice && (
          <div className="reviewNotice" role="status">
            {reviewNotice}
          </div>
        )}

        <div className="reviewsEntry">
          <button
            className="reviewsEntryBtn"
            onClick={() => setReviewsOpen(true)}
            data-testid="open-reviews-btn"
          >
            <span className="reviewsStars">
              {"★".repeat(Math.max(1, Math.round(summary.avg_rating || 5)))}
            </span>
            <span>
              <strong>Avaliações do Restaurante</strong>
              <small>
                {summary.total
                  ? `${summary.avg_rating.toFixed(1).replace(".", ",")} de 5 em ${summary.total} avaliações`
                  : "Seja o primeiro a avaliar"}
              </small>
            </span>
          </button>
        </div>

        {!data.products.length && (
          <div className="emptyState">Nenhum prato encontrado.</div>
        )}

        {featured.map((item) => (
          <button
            className="featured"
            key={item.id}
            onClick={() => openProduct(item.id)}
            data-testid={`featured-product-${item.id}`}
          >
            <div
              className="thumb"
              style={{
                backgroundImage: item.image_url
                  ? `url(${mediaUrl(item.image_url)})`
                  : "linear-gradient(135deg,#2a2a2f,#111)",
              }}
            />
            <div className="featuredShade" />
            <div className="cornerLogo">
              {logo ? <img src={logo} alt="Logo" /> : "M"}
            </div>
            <div className="featuredBadge">
              <span>{item.featured_icon || "🔥"}</span>
              <span>{item.featured_label || "Mais pedido hoje"}</span>
            </div>
            {item.video_url && (
              <div className="playBtn">
                <i className="fas fa-play" />
              </div>
            )}
            <div className="featuredBody">
              <div className="featuredTitle">{item.title}</div>
              <p className="featuredDesc">{item.description}</p>
              {item.allergens && (
                <div className="allergenPill">
                  {String(item.allergens)
                    .split(",")
                    .map((allergen) => (
                      <span key={allergen}>
                        {allergenIcons[allergen] || "⚠️"}
                      </span>
                    ))}
                </div>
              )}
              <div className="featuredFoot">
                <div className="price">{money(item.price_cents)}</div>
                <div className="footBtns">
                  {item.ar_model_url && (
                    <span className="arBtn">
                      <i className="fas fa-cube" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}

        {groups.map(({ category, products }) => (
          <section key={category.id}>
            <div className="section">{category.name.toUpperCase()}</div>
            <div className="menuGrid">
              {products.map((item) => (
                <button
                  className="pcard"
                  key={item.id}
                  onClick={() => openProduct(item.id)}
                  data-testid={`product-card-${item.id}`}
                >
                  <div
                    className="pcThumb"
                    style={{
                      backgroundImage: item.image_url
                        ? `url(${mediaUrl(item.image_url)})`
                        : "linear-gradient(135deg,#2a2a2f,#111)",
                    }}
                  />
                  <div className="pcShade" />
                  <div className="pcLogo">
                    {logo ? <img src={logo} alt="Logo" /> : "M"}
                  </div>
                  {item.video_url && (
                    <div className="playBtn small">
                      <i className="fas fa-play" />
                    </div>
                  )}
                  <div className="pcBody">
                    <div className="pcTitle">{item.title}</div>
                    {item.allergens && (
                      <div className="allergenPill">
                        {String(item.allergens)
                          .split(",")
                          .map((allergen) => (
                            <span key={allergen}>
                              {allergenIcons[allergen] || "⚠️"}
                            </span>
                          ))}
                      </div>
                    )}
                    <div className="pcFoot">
                      <div className="price sm">{money(item.price_cents)}</div>
                      <div className="footBtns">
                        {item.ar_model_url && (
                          <span className="arBtn sm">
                            <i className="fas fa-cube" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {reviewsOpen && (
        <div
          className="reviewsModal show"
          onClick={(event) =>
            event.target === event.currentTarget && setReviewsOpen(false)
          }
        >
          <div className="reviewsDialog">
            <div className="reviewsHead">
              <div>
                <span>Avaliações do Restaurante</span>
                <strong>{settings.store_name}</strong>
              </div>
              <button
                className="reviewsClose"
                onClick={() => setReviewsOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="reviewsBody">
              <div className="approvedReviews">
                {reviews.length ? (
                  reviews.map((review) => (
                    <div className="reviewCard" key={review.id}>
                      <div className="reviewCardTop">
                        <strong>{review.customer_name || "Cliente"}</strong>
                        <span>{"★".repeat(review.rating)}</span>
                      </div>
                      <p>{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="reviewEmpty">
                    Ainda não existem avaliações aprovadas.
                  </div>
                )}
              </div>
              <form className="reviewForm" onSubmit={submitReview}>
                <h3>Deixe sua avaliação</h3>
                <div className="ratingPicker">
                  {[1, 2, 3, 4, 5].map((number) => (
                    <button
                      type="button"
                      className={number <= rating ? "active" : ""}
                      onClick={() => setRating(number)}
                      key={number}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <input
                  className="reviewInput"
                  name="customer_name"
                  maxLength="120"
                  placeholder="Seu nome (opcional)"
                />
                <textarea
                  className="reviewTextarea"
                  name="comment"
                  maxLength="1000"
                  rows="4"
                  placeholder="Conte como foi sua experiência"
                />
                <button
                  className="reviewSubmit"
                  data-testid="submit-review-btn"
                >
                  Enviar para aprovação
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {product && (
        <div
          className="modal show pmProductViewer"
          role="dialog"
          aria-modal="true"
          aria-label={`Produto: ${product.title}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
        >
          <button
            className="modalIconBtn modalCloseBtn"
            onClick={closeProductViewer}
            aria-label="Fechar produto"
          >
            ✕
          </button>

          <div className="pmViewerPosition" aria-live="polite">
            {viewerIdx + 1} / {allProducts.length}
          </div>

          <div className="pmViewerViewport">
            {renderViewerSlide(product, "current")}
            {renderViewerSlide(incomingProduct, "incoming")}
          </div>
        </div>
      )}

      {showSwipeTutorial && product && (
        <div
          className="pmSwipeTutorial"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pm-swipe-title"
          onClick={dismissSwipeTutorial}
        >
          <div
            className="pmSwipeTutorialContent"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="pm-swipe-title">Navegue pelos produtos</h2>
            <p>
              Passe de um produto para outro com um movimento simples na tela.
            </p>

            <div className="pmSwipeGesture" aria-hidden="true">
              <span className="pmSwipeArrow pmSwipeArrow--up">↑</span>
              <span className="pmSwipeHand">☝️</span>
              <span className="pmSwipeArrow pmSwipeArrow--down">↓</span>
            </div>

            <div className="pmSwipeLabels">
              <span>
                <strong>Deslize para cima</strong>
                Próximo produto
              </span>
              <i />
              <span>
                <strong>Deslize para baixo</strong>
                Produto anterior
              </span>
            </div>

            <button
              type="button"
              className="pmTutorialButton"
              onClick={dismissSwipeTutorial}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}