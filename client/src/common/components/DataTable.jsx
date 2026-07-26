import React from "react";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";


const DataTable = ({
  columns = [],
  data = [],
  rowKey,
  loading = false,
  emptyText = "No records found",
  emptyIcon,
  className = "",
}) => {
  if (loading) return <Spinner text="Loading data…" />;
  if (!data.length) return <EmptyState text={emptyText} icon={emptyIcon} />;

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col, i) => (
                <th
                  key={col.key || i}
                  className={`px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left"
                  } ${col.headerClassName || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row, idx) : idx}
                className="hover:bg-gray-50/80 transition-colors group"
              >
                {columns.map((col, ci) => (
                  <td
                    key={col.key || ci}
                    className={`px-5 py-4 ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {col.render
                      ? col.render(row, idx)
                      : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
