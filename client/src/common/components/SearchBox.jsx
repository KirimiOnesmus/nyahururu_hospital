import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

const SearchBox = ({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
  onClear,
  ...rest
}) => (
  <div className={`relative ${className}`}>
    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white transition-shadow focus:ring-2 focus:ring-blue-400 focus:border-transparent"
      {...rest}
    />
    {value && onClear && (
      <button
        type="button"
        onClick={onClear}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
        aria-label="Clear search"
      >
        <FaTimes className="text-xs" />
      </button>
    )}
  </div>
);

export default SearchBox;
