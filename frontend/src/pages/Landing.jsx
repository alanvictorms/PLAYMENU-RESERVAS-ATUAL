import { useEffect, useState } from "react";

const LANDING_CONTENT_URL = "/landing-content.html";

export default function Landing() {
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch(LANDING_CONTENT_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Falha ao carregar a landing page: ${response.status}`);
        }

        return response.text();
      })
      .then(setHtml)
      .catch((loadError) => {
        if (loadError.name === "AbortError") return;
        console.error(loadError);
        setError("Não foi possível carregar a página inicial.");
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!html) return undefined;

    document.body.classList.add("pm-landing-body");

    const cleanups = [];
    const on = (target, eventName, handler, options) => {
      if (!target) return;
      target.addEventListener(eventName, handler, options);
      cleanups.push(() => target.removeEventListener(eventName, handler, options));
    };

    const header = document.querySelector("[data-pm-header]");
    const menuButton = document.querySelector("[data-pm-menu-button]");
    const mobileMenu = document.querySelector("[data-pm-mobile-menu]");
    const backTopButton = document.querySelector("[data-pm-back-top]");
    const heroVisual = document.querySelector("[data-pm-hero-visual]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const closeMenu = () => {
      menuButton?.setAttribute("aria-expanded", "false");
      mobileMenu?.classList.remove("is-open");
      document.body.classList.remove("pm-menu-open");
    };

    const updateScrollState = () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 18);
      backTopButton?.classList.toggle("is-visible", window.scrollY > 650);
    };

    updateScrollState();
    on(window, "scroll", updateScrollState, { passive: true });

    on(menuButton, "click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      mobileMenu?.classList.toggle("is-open", !isOpen);
      document.body.classList.toggle("pm-menu-open", !isOpen);
    });

    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((link) => {
      on(link, "click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;

        event.preventDefault();
        closeMenu();
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      });
    });

    on(backTopButton, "click", () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });

    const faqItems = [...document.querySelectorAll(".pm-faq-item")];
    faqItems.forEach((item) => {
      const button = item.querySelector("[data-pm-faq-button]");
      const answer = item.querySelector("[data-pm-faq-answer]");

      on(button, "click", () => {
        const shouldOpen = !item.classList.contains("is-open");

        faqItems.forEach((faqItem) => {
          faqItem.classList.remove("is-open");
          faqItem.querySelector("[data-pm-faq-button]")?.setAttribute("aria-expanded", "false");
          const faqAnswer = faqItem.querySelector("[data-pm-faq-answer]");
          if (faqAnswer) faqAnswer.style.maxHeight = null;
        });

        if (shouldOpen && answer) {
          item.classList.add("is-open");
          button.setAttribute("aria-expanded", "true");
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        }
      });
    });

    const tabs = [...document.querySelectorAll("[data-pm-tab]")];
    const panels = [...document.querySelectorAll("[data-pm-panel]")];

    tabs.forEach((tab) => {
      on(tab, "click", () => {
        const targetName = tab.getAttribute("data-pm-tab");

        tabs.forEach((candidate) => {
          const active = candidate === tab;
          candidate.classList.toggle("is-active", active);
          candidate.setAttribute("aria-selected", String(active));
        });

        panels.forEach((panel) => {
          const active = panel.getAttribute("data-pm-panel") === targetName;
          panel.classList.toggle("is-active", active);

          const video = panel.querySelector("video");
          if (!video) return;
          if (active) video.play().catch(() => {});
          else video.pause();
        });

        if (targetName === "painel") {
          document.querySelectorAll("[data-pm-counter]").forEach((counter) => {
            animateCounter(counter, reducedMotion);
          });
        }
      });
    });

    const revealElements = [...document.querySelectorAll("[data-pm-reveal]")];

    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
      );

      revealElements.forEach((element) => observer.observe(element));
      cleanups.push(() => observer.disconnect());
    }

    if (heroVisual && !reducedMotion) {
      on(heroVisual, "pointermove", (event) => {
        const rect = heroVisual.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        heroVisual.style.setProperty("--pm-pointer-x", `${x * 12}px`);
        heroVisual.style.setProperty("--pm-pointer-y", `${y * 12}px`);
      });

      on(heroVisual, "pointerleave", () => {
        heroVisual.style.setProperty("--pm-pointer-x", "0px");
        heroVisual.style.setProperty("--pm-pointer-y", "0px");
      });
    }

    document.querySelectorAll("video[autoplay]").forEach((video) => {
      video.play().catch(() => {});
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      document.body.classList.remove("pm-landing-body", "pm-menu-open");
    };
  }, [html]);

  if (error) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }} role="alert">
        <div style={{ textAlign: "center" }}>
          <strong>{error}</strong>
          <br />
          <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 16 }}>
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  if (!html) {
    return <main style={{ minHeight: "100vh", background: "#f7f7f5" }} aria-busy="true" />;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function animateCounter(element, reducedMotion) {
  if (element.dataset.pmAnimated === "true") return;

  const target = Number(element.getAttribute("data-pm-counter"));
  if (!Number.isFinite(target)) return;

  element.dataset.pmAnimated = "true";

  if (reducedMotion) {
    element.textContent = target.toLocaleString("pt-BR");
    return;
  }

  const duration = 950;
  const start = performance.now();

  const frame = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased).toLocaleString("pt-BR");

    if (progress < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}