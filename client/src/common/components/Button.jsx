import React from "react";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none min-h-11";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover",
  secondary:
    "bg-surface text-ink border border-line hover:bg-canvas active:bg-canvas",
  danger: "bg-danger text-white hover:opacity-90 active:opacity-80",
  ghost: "bg-transparent text-ink-muted hover:bg-canvas hover:text-ink",
  "danger-outline":
    "bg-surface text-danger border border-red-200 hover:bg-red-50 dark:border-red-900",
  accent: "bg-accent text-white hover:opacity-90",
};

const sizes = {
  sm: "px-3 py-2 text-xs min-h-11",
  md: "px-4 py-2.5 text-sm min-h-11",
  lg: "px-5 py-3 text-base min-h-12",
};

const Spinner = () => (
  <span
    className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"
    aria-hidden="true"
  />
);

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  icon: Icon,
  iconRight: IconRight,
  className = "",
  disabled,
  type = "button",
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingText || children}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
          {children}
          {IconRight && <IconRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
        </>
      )}
    </button>
  );
};

export default Button;
