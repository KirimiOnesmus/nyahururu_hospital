import { useEffect } from "react";
import api from "../../api/axios";
import { setClientSessionAccount } from "../../api/session";

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

    const syncActiveSession = async () => {
      if (!localStorage.getItem("role")) return;
      requestInFlight = true;
      try {
        const response = await api.post("/sessions/activity");
        const { accountId, collection } = response.data || {};
        if (accountId != null && collection) setClientSessionAccount({ accountId, collection });
      } catch {
        // The API interceptor handles sessions that were already revoked.
      } finally {
        requestInFlight = false;
      }
    };
    syncActiveSession();

    const timer = window.setInterval(async () => {
      if (!localStorage.getItem("role") || document.visibilityState !== "visible" ||
          Date.now() - lastInteractionAt > ACTIVE_WINDOW_MS || requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await api.post("/sessions/activity");
        const { accountId, collection } = response.data || {};
        if (accountId != null && collection) setClientSessionAccount({ accountId, collection });
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
