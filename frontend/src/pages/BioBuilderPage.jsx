import { useEffect, useRef, useState } from "react";
import { PageContent, PageHeader } from "../components/RestaurantLayout";
import { useLegacyStyles } from "../hooks/useLegacyStyles";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const loadScript = (src) => new Promise((resolve, reject) => {
  const existing = document.querySelector(`script[data-bio-script="${src}"]`);
  if (existing) return resolve(existing);
  const script = document.createElement("script");
  script.src = src; script.dataset.bioScript = src; script.onload = () => resolve(script); script.onerror = reject;
  document.body.appendChild(script);
});

export default function BioBuilderPage() {
  useLegacyStyles("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css", "bio-builder-body restaurant-bio-builder-page");
  useLegacyStyles("/bio-builder/css/playmenu-ui.css", "bio-builder-body restaurant-bio-builder-page");
  useLegacyStyles("/bio-builder/css/builder-mobile.css", "bio-builder-body restaurant-bio-builder-page");
  const [markup, setMarkup] = useState(""); const [error, setError] = useState(""); const initialized = useRef(false);

  useEffect(() => { fetch("/bio-builder/markup.html").then((r) => r.text()).then(setMarkup).catch(() => setError("Não foi possível abrir o editor.")); }, []);
  useEffect(() => {
    if (!markup || initialized.current) return;
    initialized.current = true;
    window.PLAYMENU_BIO_API = BACKEND_URL;
    (async () => {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js");
        await loadScript("/bio-builder/js/playmenu-ui.js");
        await loadScript("/bio-builder/js/playmenu-bio-builder-mobile.js");
      } catch { setError("Não foi possível inicializar as ferramentas do editor."); }
    })();
    return () => {
      document.querySelectorAll('script[data-bio-script="/bio-builder/js/playmenu-ui.js"],script[data-bio-script="/bio-builder/js/playmenu-bio-builder-mobile.js"]').forEach((script) => script.remove());
      delete window.PLAYMENU_BIO_API;
    };
  }, [markup]); 

  if (error) return <><PageHeader title="Link-in-Bio" description="Crie e publique páginas vinculadas ao seu restaurante." /><PageContent><div className="ui-alert ui-alert--danger" role="alert">{error}</div></PageContent></>;
  if (!markup) return <div className="page-loading">Carregando editor Link-in-Bio...</div>;
  return <div className="restaurant-bio-builder-host" data-testid="link-in-bio-builder" dangerouslySetInnerHTML={{ __html: markup }} />;
}
