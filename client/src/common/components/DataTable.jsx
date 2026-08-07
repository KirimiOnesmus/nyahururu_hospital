// import React from "react";
// import Spinner from "./Spinner";
// import EmptyState from "./EmptyState";


// const DataTable = ({
//   columns = [],
//   data = [],
//   rowKey,
//   loading = false,
//   emptyText = "No records found",
//   emptyIcon,
//   className = "",
// }) => {
//   if (loading) return <Spinner text="Loading data…" />;
//   if (!data.length) return <EmptyState text={emptyText} icon={emptyIcon} />;

//   return (
//     <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-100">
//               {columns.map((col, i) => (
//                 <th
//                   key={col.key || i}
//                   className={`px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
//                     col.align === "right"
//                       ? "text-right"
//                       : col.align === "center"
//                         ? "text-center"
//                         : "text-left"
//                   } ${col.headerClassName || ""}`}
//                 >
//                   {col.label}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-50">
//             {data.map((row, idx) => (
//               <tr
//                 key={rowKey ? rowKey(row, idx) : idx}
//                 className="hover:bg-gray-50/80 transition-colors group"
//               >
//                 {columns.map((col, ci) => (
//                   <td
//                     key={col.key || ci}
//                     className={`px-5 py-4 ${
//                       col.align === "right"
//                         ? "text-right"
//                         : col.align === "center"
//                           ? "text-center"
//                           : "text-left"
//                     }`}
//                   >
//                     {col.render
//                       ? col.render(row, idx)
//                       : row[col.key] ?? "—"}
//                   </td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default DataTable;
import React, { useState } from "react";
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
  onRowClick,
  isRowSelected,
  selectedRowClassName = "bg-blue-50/70 hover:bg-blue-50",
  bare = false,
  // Optional nested/collapsible rows. Pass:
  //   expandable={{ getChildren: (row) => row.childSubmissions,
  //                 renderChild: (child, parent) => <ReactNode/>,
  //                 defaultExpanded: false }}
  // Rows with children get a chevron; children render collapsed by default.
  expandable = null,
}) => {
  const [expanded, setExpanded] = useState(() => new Set());
  const toggleRow = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  if (loading) return <Spinner text="Loading data…" />;
  if (!data.length) return <EmptyState text={emptyText} icon={emptyIcon} />;

  const table = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {expandable && <th className="w-8 px-2 py-4" aria-hidden="true" />}
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
          {data.map((row, idx) => {
            const selected = isRowSelected ? isRowSelected(row, idx) : false;
            const key = rowKey ? rowKey(row, idx) : idx;
            const children = expandable?.getChildren ? expandable.getChildren(row) || [] : [];
            const hasChildren = children.length > 0;
            const isOpen = expandable?.defaultExpanded ? !expanded.has(key) : expanded.has(key);
            return (
              <React.Fragment key={key}>
              <tr
                onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                aria-selected={onRowClick ? selected : undefined}
                className={`transition-colors group ${onRowClick ? "cursor-pointer" : ""} ${
                  selected ? selectedRowClassName : "hover:bg-gray-50/80"
                }`}
              >
                {expandable && (
                  <td className="w-8 px-2 py-4 align-top">
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleRow(key); }}
                        aria-label={isOpen ? "Collapse" : "Expand"}
                        className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        <span className={`inline-block transition-transform text-[10px] ${isOpen ? "rotate-90" : ""}`}>▶</span>
                      </button>
                    )}
                  </td>
                )}
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
                    {col.render ? col.render(row, idx) : row[col.key] ?? "—"}
                    {ci === 0 && hasChildren && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold align-middle">
                        {children.length}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              {expandable && isOpen && hasChildren &&
                children.map((child, cidx) =>
                  expandable.childUsesColumns ? (
                    <tr
                      key={`${key}-child-${child.id ?? cidx}`}
                      className="bg-slate-50/50 border-l-2 border-blue-100"
                    >
                      <td className="w-8 px-2 py-3 align-top" />
                      {columns.map((col, ci) => (
                        <td
                          key={col.key || ci}
                          className={`px-5 py-3 ${
                            col.align === "right"
                              ? "text-right"
                              : col.align === "center"
                                ? "text-center"
                                : "text-left"
                          } ${ci === 0 ? "pl-2" : ""}`}
                        >
                          {ci === 0 && (
                            <span className="text-slate-300 mr-1" aria-hidden="true">↳</span>
                          )}
                          {col.render ? col.render(child, cidx) : child[col.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ) : (
                    <tr key={`${key}-child-${child.id ?? cidx}`} className="bg-slate-50/50">
                      <td className="w-8 px-2 py-2" />
                      <td className="px-5 py-2" colSpan={columns.length}>
                        {expandable.renderChild
                          ? expandable.renderChild(child, row)
                          : (child.title || child.submissionType)}
                      </td>
                    </tr>
                  ),
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );


  if (bare) return table;

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
      {table}
    </div>
  );
};

export default DataTable;