import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const slug = (value) => String(value || "element").toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 45);

export const useTestIds = () => {
  const location = useLocation();
  useEffect(() => {
    let serial = 0;
    const assign = () => {
      document.querySelectorAll("button,a,input,select,textarea,[role='alert'],[role='dialog'],[data-critical]").forEach((element) => {
        if (!element.dataset.testid) {
          const hint = element.getAttribute("aria-label") || element.getAttribute("name") || element.textContent || element.tagName;
          element.dataset.testid = `${slug(location.pathname)}-${slug(hint)}-${serial++}`;
        }
      });
    };
    assign();
    const observer = new MutationObserver(assign);
    observer.observe(document.body, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, [location.pathname]);
};