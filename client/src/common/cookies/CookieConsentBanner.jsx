import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_COOKIE_CATEGORIES } from "./cookieConsent";
import { useCookieConsent } from "./CookieConsentContext";

const CATEGORY_OPTIONS = [
  {
    key: "preferences",
    title: "Preference storage",
    description: "Remember your chosen theme and accessibility display settings on this device.",
  },
  {
    key: "maps",
    title: "Embedded maps",
    description: "Load Google Maps on the Contact page. Google may store cookies when the map loads.",
  },
];

export default function CookieConsentBanner() {
  const { consent, saveConsent, settingsOpen, openSettings } = useCookieConsent();
  const [draft, setDraft] = useState(DEFAULT_COOKIE_CATEGORIES);

  useEffect(() => {
    setDraft(consent?.categories || DEFAULT_COOKIE_CATEGORIES);
  }, [consent, settingsOpen]);

  if (consent && !settingsOpen) return null;

  const acceptAll = () => saveConsent({ ...draft, preferences: true, maps: true });
  const rejectOptional = () => saveConsent({ ...draft, preferences: false, maps: false });

  return (
    <section
      aria-labelledby="cookie-consent-title"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-h-[min(85vh,48rem)] max-w-3xl overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-2xl sm:inset-x-6 sm:bottom-6 sm:p-6"
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
            Privacy choices
          </p>
          <h2 id="cookie-consent-title" className="text-lg font-bold text-ink">
            {settingsOpen ? "Cookie and storage preferences" : "Your cookie choices matter"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            We use essential storage for security and core site functions. Optional preference storage
            remembers display choices, and the Contact page can load a Google Map. Optional categories
            stay off until you choose them. We do not currently use analytics or advertising cookies.
          </p>
        </div>

        <div className="divide-y divide-line rounded-xl border border-line">
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">Essential cookies and storage</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                Supports sign-in, security, and remembering this consent choice. Always active.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              Always on
            </span>
          </div>

          {settingsOpen && CATEGORY_OPTIONS.map(({ key, title, description }) => (
            <label key={key} className="flex min-h-16 cursor-pointer items-start justify-between gap-4 p-4">
              <span>
                <span className="block text-sm font-semibold text-ink">{title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{description}</span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(draft[key])}
                onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.checked }))}
                className="mt-1 h-5 w-5 shrink-0 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </label>
          ))}

          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">Analytics and advertising</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                These would measure site visits or personalize ads. We do not currently use them.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-ink-muted">
              Not in use
            </span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/privacy-policy" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
            Read our Privacy Policy
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={rejectOptional} className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:bg-canvas">
              Reject optional
            </button>
            {!settingsOpen ? (
              <button type="button" onClick={openSettings} className="min-h-11 rounded-lg border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary-soft">
                Customize
              </button>
            ) : (
              <button type="button" onClick={() => saveConsent(draft)} className="min-h-11 rounded-lg border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary-soft">
                Save my choices
              </button>
            )}
            <button type="button" onClick={acceptAll} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">
              Accept all
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
