import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollBehaviour() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Route changes should start at the beginning of the new page without
    // making the user wait through a long animated scroll.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
