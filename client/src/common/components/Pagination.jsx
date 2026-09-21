import React from "react";
import { IconChevronLeft, IconChevronRight } from "../icons";

const Pagination = ({ currentPage, totalPages, onPageChange, className = "" }) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 mt-6 ${className}`}
      role="navigation"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex items-center justify-center gap-1 min-h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <IconChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <p className="min-w-[5.5rem] text-center text-sm text-ink-muted tabular-nums">
        <span className="font-semibold text-ink">{currentPage}</span>
        <span> of </span>
        <span className="font-semibold text-ink">{totalPages}</span>
      </p>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="inline-flex items-center justify-center gap-1 min-h-11 px-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <IconChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
