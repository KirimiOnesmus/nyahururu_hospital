import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";
import { IconChevronRight, IconWarning } from "../icons";

const PRIORITY = { A: "A", B: "B", C: "C", D: "D", primary: "A", secondary: "B", supporting: "C", administrative: "D" };

const isActionsCol = (col) =>
  col.key === "actions" || String(col.label || "").toLowerCase() === "actions";

const isStatusCol = (col) => String(col.key || "").toLowerCase() === "status";

function classifyColumns(columns) {
  return columns.map((col, i) => {
    const key = String(col.key || col.label || "").toLowerCase();
    const priority = PRIORITY[col.priority] || (i === 0 || isActionsCol(col) || isStatusCol(col) ? "A" : i <= 2 ? "B" : "C");
    let mobileSlot = col.mobileSlot;
    if (!mobileSlot) {
      if (i === 0) mobileSlot = "identity";
      else if (isStatusCol(col)) mobileSlot = "status";
      else if (isActionsCol(col)) mobileSlot = "actions";
      else if (col.align === "right" || /amount|total|price|qty|quantity|count|value/.test(key)) mobileSlot = "value";
      else mobileSlot = "meta";
    }
    return { ...col, priority, mobileSlot };
  });
}

function cellValue(col, row, idx) {
  if (col.render) return col.render(row, idx);
  const value = row[col.key];
  return value == null || value === "" ? "—" : value;
}

function useContainerMode(ref, mobileAt = 720, tabletAt = 1024) {
  const [mode, setMode] = useState("desktop");

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = (width) => {
      setMode(width < mobileAt ? "mobile" : width < tabletAt ? "tablet" : "desktop");
    };

    update(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobileAt, tabletAt]);

  return mode;
}

const alignClass = (align) =>
  align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

const SkeletonRows = ({ mode, cols }) => {
  if (mode === "mobile") {
    return (
      <div className="divide-y divide-line" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-4 space-y-2">
            <div className="flex justify-between gap-4">
              <div className="h-4 w-36 bg-canvas rounded" />
              <div className="h-4 w-16 bg-canvas rounded" />
            </div>
            <div className="flex justify-between gap-4">
              <div className="h-3 w-20 bg-canvas rounded" />
              <div className="h-3 w-24 bg-canvas rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-line" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="h-4 flex-1 bg-canvas rounded" />
          ))}
        </div>
      ))}
    </div>
  );
};

const DesktopTable = ({
  columns,
  data,
  rowKey,
  onRowClick,
  isRowSelected,
  selectedRowClassName,
  expandable,
  expanded,
  toggleRow,
  revealIdPrefix,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-canvas border-b border-line">
          {expandable && <th className="w-11 px-2 py-3" aria-hidden="true" />}
          {columns.map((col, i) => (
            <th
              key={col.key || i}
              scope="col"
              className={`px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider ${alignClass(col.align)} ${col.headerClassName || ""}`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {data.map((row, idx) => {
          const selected = isRowSelected ? isRowSelected(row, idx) : false;
          const key = rowKey ? rowKey(row, idx) : idx;
          const children = expandable?.getChildren ? expandable.getChildren(row) || [] : [];
          const hasChildren = children.length > 0;
          const isOpen = expandable?.defaultExpanded ? !expanded.has(key) : expanded.has(key);
          const panelId = `${revealIdPrefix}-${key}`;

          return (
            <React.Fragment key={key}>
              <tr
                onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                aria-selected={onRowClick ? selected : undefined}
                className={`transition-colors group ${onRowClick ? "cursor-pointer" : ""} ${
                  selected ? selectedRowClassName : "hover:bg-canvas"
                }`}
              >
                {expandable && (
                  <td className="w-11 px-2 py-3 align-middle">
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(key);
                        }}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        aria-label={isOpen ? "Collapse row" : "Expand row"}
                        className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl text-ink-muted hover:text-primary hover:bg-primary-soft"
                      >
                        <IconChevronRight
                          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </td>
                )}
                {columns.map((col, ci) => (
                  <td key={col.key || ci} className={`px-5 py-3.5 ${alignClass(col.align)}`}>
                    {cellValue(col, row, idx)}
                    {ci === 0 && hasChildren && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-canvas text-ink-muted text-[10px] font-semibold align-middle">
                        {children.length}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              {expandable && isOpen && hasChildren &&
                children.map((child, cidx) =>
                  expandable.childUsesColumns ? (
                    <tr key={`${key}-child-${child.id ?? cidx}`} className="bg-canvas">
                      <td className="w-11 px-2 py-3" />
                      {columns.map((col, ci) => (
                        <td key={col.key || ci} className={`px-5 py-3 ${alignClass(col.align)}`}>
                          {col.render ? col.render(child, cidx) : child[col.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ) : (
                    <tr key={`${key}-child-${child.id ?? cidx}`} className="bg-canvas">
                      <td className="w-11 px-2 py-2" />
                      <td className="px-5 py-2" colSpan={columns.length} id={panelId}>
                        {expandable.renderChild
                          ? expandable.renderChild(child, row)
                          : child.title || child.submissionType}
                      </td>
                    </tr>
                  )
                )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  </div>
);

const MobileRows = ({
  columns,
  data,
  rowKey,
  onRowClick,
  isRowSelected,
  selectedRowClassName,
  expanded,
  toggleRow,
  revealIdPrefix,
}) => {
  const identity = columns.find((c) => c.mobileSlot === "identity") || columns[0];
  const value = columns.find((c) => c.mobileSlot === "value");
  const status = columns.find((c) => c.mobileSlot === "status");
  const actions = columns.find((c) => c.mobileSlot === "actions");
  const meta = columns.filter(
    (c) =>
      c.priority === "B" &&
      c !== identity &&
      c !== value &&
      c !== status &&
      c !== actions
  );
  const revealCols = columns.filter(
    (c) =>
      (c.priority === "C" || c.priority === "D" || (c.priority === "B" && c !== meta[0])) &&
      c !== identity &&
      c !== value &&
      c !== status &&
      c !== actions &&
      !meta.includes(c)
  );

  return (
    <ul className="divide-y divide-line">
      {data.map((row, idx) => {
        const key = rowKey ? rowKey(row, idx) : idx;
        const isOpen = expanded.has(key);
        const selected = isRowSelected ? isRowSelected(row, idx) : false;
        const panelId = `${revealIdPrefix}-${key}`;
        const canReveal = revealCols.length > 0 || actions;

        return (
          <li
            key={key}
            className={`${selected ? selectedRowClassName : ""}`}
          >
            <div
              className={`px-4 py-4 ${onRowClick ? "cursor-pointer" : ""}`}
              onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 text-sm font-semibold text-ink">
                  {cellValue(identity, row, idx)}
                </div>
                {value && (
                  <div className="shrink-0 text-sm font-semibold text-ink text-right tabular-nums">
                    {cellValue(value, row, idx)}
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {status && cellValue(status, row, idx)}
                </div>
                {meta[0] && (
                  <p className="text-xs text-ink-muted text-right shrink-0">
                    <span className="mr-1">{meta[0].label}:</span>
                    {cellValue(meta[0], row, idx)}
                  </p>
                )}
              </div>

              {canReveal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRow(key);
                  }}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="mt-3 inline-flex items-center gap-1 min-h-11 text-sm font-medium text-primary"
                >
                  <IconChevronRight
                    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    aria-hidden="true"
                  />
                  {isOpen ? "Hide details" : "View details"}
                </button>
              )}
            </div>

            {canReveal && isOpen && (
              <div id={panelId} className="px-4 pb-4 rt-reveal">
                <dl className="grid gap-2 rounded-xl bg-canvas border border-line p-3">
                  {revealCols.map((col, ci) => (
                    <div key={col.key || ci} className="flex items-start justify-between gap-3">
                      <dt className="text-xs font-medium text-ink-muted">{col.label}</dt>
                      <dd className="text-sm text-ink text-right min-w-0 break-words">
                        {cellValue(col, row, idx)}
                      </dd>
                    </div>
                  ))}
                  {meta.slice(1).map((col, ci) => (
                    <div key={`meta-${col.key || ci}`} className="flex items-start justify-between gap-3">
                      <dt className="text-xs font-medium text-ink-muted">{col.label}</dt>
                      <dd className="text-sm text-ink text-right min-w-0 break-words">
                        {cellValue(col, row, idx)}
                      </dd>
                    </div>
                  ))}
                </dl>
                {actions && (
                  <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    {cellValue(actions, row, idx)}
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

const DataTable = ({
  columns = [],
  data = [],
  rowKey,
  loading = false,
  emptyText = "No records found",
  emptyIcon,
  emptyDescription,
  className = "",
  onRowClick,
  isRowSelected,
  selectedRowClassName = "bg-primary-soft",
  bare = false,
  expandable = null,
  error = null,
  onRetry,
  mobileAt = 720,
  tabletAt = 1024,
}) => {
  const wrapRef = useRef(null);
  const mode = useContainerMode(wrapRef, mobileAt, tabletAt);
  const [expanded, setExpanded] = useState(() => new Set());
  const revealIdPrefix = useId();

  const classified = useMemo(() => classifyColumns(columns), [columns]);

  const visibleColumns = useMemo(() => {
    if (mode === "desktop") return classified;
    return classified.filter((c) => c.priority === "A" || c.priority === "B");
  }, [classified, mode]);

  const toggleRow = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const body = (() => {
    if (error) {
      return (
        <EmptyState
          text={typeof error === "string" ? error : "Unable to load records"}
          description="Something went wrong while retrieving the data."
          icon={IconWarning}
          action={
            onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 min-h-11 px-4 rounded-xl bg-primary text-white text-sm font-semibold"
              >
                Try again
              </button>
            ) : null
          }
        />
      );
    }

    if (loading) return <SkeletonRows mode={mode} cols={visibleColumns.length || 4} />;
    if (!data.length) {
      return <EmptyState text={emptyText} icon={emptyIcon} description={emptyDescription} />;
    }

    if (mode === "mobile") {
      return (
        <MobileRows
          columns={classified}
          data={data}
          rowKey={rowKey}
          onRowClick={onRowClick}
          isRowSelected={isRowSelected}
          selectedRowClassName={selectedRowClassName}
          expanded={expanded}
          toggleRow={toggleRow}
          revealIdPrefix={revealIdPrefix}
        />
      );
    }

    return (
      <DesktopTable
        columns={visibleColumns}
        data={data}
        rowKey={rowKey}
        onRowClick={onRowClick}
        isRowSelected={isRowSelected}
        selectedRowClassName={selectedRowClassName}
        expandable={expandable}
        expanded={expanded}
        toggleRow={toggleRow}
        revealIdPrefix={revealIdPrefix}
      />
    );
  })();

  if (bare) {
    return (
      <div ref={wrapRef} className={className}>
        {loading && !error && data.length === 0 ? <Spinner text="Loading data…" /> : body}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`bg-surface rounded-2xl border border-line overflow-hidden shadow-sm ${className}`}
    >
      {body}
    </div>
  );
};

export default DataTable;
