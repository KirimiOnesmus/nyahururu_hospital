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
    className={`bg-white rounded-2xl border border-gray-100 ${padding} ${
      hoverable ? "hover:border-blue-400 transition-colors cursor-pointer" : ""
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
