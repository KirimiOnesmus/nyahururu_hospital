import { useTheme } from "../../theme/ThemeProvider";

const OPTIONS = {
  textSize: [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ],
  pageWidth: [
    { value: "standard", label: "Standard" },
    { value: "wide", label: "Wide" },
  ],
  textAlignment: [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
    { value: "justify", label: "Justified" },
  ],
};

function ChoiceGroup({ label, options, value, onSelect }) {
  return (
    <fieldset className="accessibility-fieldset">
      <legend className="accessibility-legend">{label}</legend>
      <div className="accessibility-choices" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`accessibility-choice${value === option.value ? " is-selected" : ""}`}
            aria-pressed={value === option.value}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function AccessibilityControls() {
  const { resolved, setTheme, accessibility, setAccessibility } = useTheme();

  return (
    <details className="accessibility-menu">
      <summary className="accessibility-trigger" aria-label="Accessibility options">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="4.5" r="2.2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8.5h16M12 7v13m0-7-5 7m5-7 5 7" />
        </svg>
        <span className="accessibility-trigger-label">Accessibility</span>
      </summary>
      <div className="accessibility-panel">
        <h2 className="accessibility-title">Accessibility options</h2>
        <ChoiceGroup
          label="Text size"
          options={OPTIONS.textSize}
          value={accessibility.textSize}
          onSelect={(value) => setAccessibility((current) => ({ ...current, textSize: value }))}
        />
        <ChoiceGroup
          label="Color mode"
          options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
          value={resolved}
          onSelect={setTheme}
        />
        <ChoiceGroup
          label="Page width"
          options={OPTIONS.pageWidth}
          value={accessibility.pageWidth}
          onSelect={(value) => setAccessibility((current) => ({ ...current, pageWidth: value }))}
        />
        <ChoiceGroup
          label="Text alignment"
          options={OPTIONS.textAlignment}
          value={accessibility.textAlignment}
          onSelect={(value) => setAccessibility((current) => ({ ...current, textAlignment: value }))}
        />
      </div>
    </details>
  );
}
