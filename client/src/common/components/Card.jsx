import React from "react";

const Card = ({
  children,
  className = "",
  padding = "p-5",
  onClick,
  hoverable = false,
  ...rest
}) => (
  <div
    className={`bg-surface rounded-2xl border border-line shadow-sm ${padding} ${
      hoverable ? "hover:border-primary transition-colors cursor-pointer" : ""
    } ${className}`}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    {...rest}
  >
    {children}
  </div>
);

export default Card;
