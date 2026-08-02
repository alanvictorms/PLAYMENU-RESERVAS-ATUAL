import { useEffect } from "react";

const bodyClassRegistry = new Map();

export const useLegacyStyles = (href, bodyClass = "") => {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.playmenuStyle = "true";
    document.head.appendChild(link);

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
      link.remove();
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
