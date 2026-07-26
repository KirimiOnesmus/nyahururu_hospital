import React from "react";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1";

const variants = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400",
  secondary:
    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400",
  ghost:
    "bg-transparent text-gray-500 hover:bg-gray-100 focus:ring-gray-300",
  "danger-outline":
    "bg-white text-red-600 border border-red-200 hover:bg-red-50 focus:ring-red-300",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
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
          {Icon && <Icon className="text-xs shrink-0" />}
          {children}
          {IconRight && <IconRight className="text-xs shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
