import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

const Breadcrumb = ({ items = [], className = "" }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-sm ${className}`}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <FaChevronRight className="text-[10px] text-gray-300" />}
            {isLast || !item.to ? (
              <span className={isLast ? "text-gray-900 font-semibold" : "text-gray-400"}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
