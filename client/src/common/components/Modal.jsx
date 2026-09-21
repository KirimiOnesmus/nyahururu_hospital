import React, { useEffect } from "react";
import { IconClose } from "../icons";

const widths = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-4xl",
};

const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "lg",
  className = "",
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = widths[size] || widths.lg;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`bg-surface rounded-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto shadow-md ${className}`}
        style={{ animation: "modalPop .2s ease-out both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between p-6 border-b border-line sticky top-0 bg-surface z-10 rounded-t-2xl">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold text-ink">{title}</h2>}
              {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl hover:bg-canvas shrink-0"
                aria-label="Close"
              >
                <IconClose className="w-5 h-5 text-ink-muted" />
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
