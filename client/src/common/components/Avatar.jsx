import React from "react";

const sizes = {
  xs: "w-7 h-7 text-xs",
  sm: "w-9 h-9 text-sm",
  md: "w-11 h-11 text-base",
  lg: "w-16 h-16 text-2xl",
};

const Avatar = ({ name, src, size = "sm", className = "" }) => {
  const letter = name?.charAt(0)?.toUpperCase() || "?";
  const sizeClass = sizes[size] || sizes.sm;

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`${sizeClass} rounded-xl object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-xl bg-primary flex items-center justify-center text-white font-bold shrink-0 ${className}`}
      aria-label={name || "User"}
    >
      {letter}
    </div>
  );
};

export default Avatar;
