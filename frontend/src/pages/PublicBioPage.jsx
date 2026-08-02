import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { useLegacyStyles } from "../hooks/useLegacyStyles";

export default function PublicBioPage() {
  const { restaurantSlug, pageSlug } = useParams(); const [content, setContent] = useState(""); const [error, setError] = useState("");
  useLegacyStyles("/bio-builder/css/builder-mobile.css", "public-bio-page");
  useEffect(() => {
    api.get(`/public/bio/${restaurantSlug}/${pageSlug}`).then(({ data }) => {
      const parsed = new DOMParser().parseFromString(data.html, "text/html");
      document.title = parsed.title || data.project_name || "PlayMenu Bio";
      setContent(parsed.body.innerHTML);
    }).catch((err) => setError(err.response?.data?.detail || "Página não encontrada."));
  }, [restaurantSlug, pageSlug]);
  if (error) return <main className="public-bio-error" role="alert"><h1>PlayMenu Bio</h1><p>{error}</p></main>;
  return content ? <div data-testid="published-bio-page" dangerouslySetInnerHTML={{ __html: content }} /> : <div className="page-loading">Carregando página...</div>;
}