import React from "react";
import { IconSearch, IconClose } from "../icons";

const SearchBox = ({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
  onClear,
  label,
  id = "search",
  ...rest
}) => (
  <div className={`relative ${className}`}>
    {label && (
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
    )}
    <IconSearch
      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none"
      aria-hidden="true"
    />
    <input
      id={id}
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full min-h-11 pl-10 pr-11 py-2.5 border border-line rounded-xl text-sm outline-none bg-surface text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-primary/30 focus:border-primary"
      {...rest}
    />
    {value && onClear && (
      <button
        type="button"
        onClick={onClear}
        className="absolute right-1 top-1/2 -translate-y-1/2 min-w-11 min-h-11 inline-flex items-center justify-center text-ink-muted hover:text-ink"
        aria-label="Clear search"
      >
        <IconClose className="w-4 h-4" />
      </button>
    )}
  </div>
);

export default SearchBox;
