import { useEffect, useState } from "react";
import { useLegacyStyles } from "../hooks/useLegacyStyles";

export default function Landing() {
  const [html, setHtml] = useState("");
  useLegacyStyles("/landing.css", "landing-page");
  useEffect(() => { fetch("/landing-content.html").then((r) => r.text()).then(setHtml); }, []);
  useEffect(() => {
    if (!html) return;
    const buttons = [...document.querySelectorAll(".qa button")];
    const handlers = buttons.map((button) => {
      const handler = () => {
        const qa = button.parentElement; const answer = qa.querySelector(".ans"); const open = qa.classList.contains("open");
        document.querySelectorAll(".qa").forEach((item) => { item.classList.remove("open"); item.querySelector(".ans").style.maxHeight = null; });
        if (!open) { qa.classList.add("open"); answer.style.maxHeight = `${answer.scrollHeight}px`; }
      };
      button.addEventListener("click", handler); return [button, handler];
    });
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("in"));
    return () => handlers.forEach(([button, handler]) => button.removeEventListener("click", handler));
  }, [html]);
  return <div data-testid="landing-page-content" dangerouslySetInnerHTML={{ __html: html }} />;
}