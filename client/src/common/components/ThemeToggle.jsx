import { useTheme } from "../../theme/ThemeProvider";
import { IconSun, IconMoon, IconSystem } from "../icons";

const OPTIONS = [
  { id: "light", label: "Light", Icon: IconSun },
  { id: "dark", label: "Dark", Icon: IconMoon },
  { id: "system", label: "System", Icon: IconSystem },
];

const ThemeToggle = ({ compact = false, className = "" }) => {
  const { theme, setTheme } = useTheme();

  if (compact) {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    const current = OPTIONS.find((o) => o.id === theme) || OPTIONS[2];
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        className={`inline-flex items-center justify-center min-w-11 min-h-11 rounded-xl text-ink-muted hover:bg-canvas hover:text-ink transition-colors ${className}`}
        aria-label={`Theme: ${current.label}. Switch to ${next}`}
        title={`Theme: ${current.label}`}
      >
        <current.Icon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-line bg-surface p-0.5 ${className}`}
      role="group"
      aria-label="Color theme"
    >
      {OPTIONS.map(({ id, label, Icon }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={`inline-flex items-center justify-center min-w-11 min-h-9 px-2.5 rounded-[10px] text-xs font-medium transition-colors ${
              active
                ? "bg-primary text-white"
                : "text-ink-muted hover:text-ink hover:bg-canvas"
            }`}
            aria-pressed={active}
            aria-label={label}
            title={label}
          >
            <Icon className="w-4 h-4" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
