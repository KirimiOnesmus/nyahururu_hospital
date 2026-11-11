import { useEffect } from "react";
import api from "../../api/axios";

const HEARTBEAT_INTERVAL_MS = 3000;
const ACTIVE_WINDOW_MS = 10000;

export default function SessionActivityMonitor() {
  useEffect(() => {
    let lastInteractionAt = 0;
    let requestInFlight = false;
    const markActive = () => { lastInteractionAt = Date.now(); };
    const events = ["pointerdown", "keydown", "touchstart", "wheel"];
    events.forEach((event) => window.addEventListener(event, markActive, { passive: true, capture: true }));
    window.addEventListener("focus", markActive);

    const timer = window.setInterval(async () => {
      if (!localStorage.getItem("role") || document.visibilityState !== "visible" ||
          Date.now() - lastInteractionAt > ACTIVE_WINDOW_MS || requestInFlight) return;
      requestInFlight = true;
      try {
        await api.post("/sessions/activity");
      } catch {
        // The API interceptor handles revoked sessions; transient failures retry on the next tick.
      } finally {
        requestInFlight = false;
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, markActive, true));
      window.removeEventListener("focus", markActive);
    };
  }, []);

  return null;
}
