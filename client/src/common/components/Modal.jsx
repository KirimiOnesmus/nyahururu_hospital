import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`bg-white rounded-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto ${className}`}
        style={{ animation: "modalPop .22s cubic-bezier(.34,1.56,.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
            <div className="min-w-0">
              {title && (
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              )}
              {subtitle && (
                <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors shrink-0"
                aria-label="Close"
              >
                <FaTimes className="text-gray-400" />
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
