import React from "react";

interface Column {
  key: string;
  label: string;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  className?: string;
}

export default function ResponsiveTable({
  columns,
  data,
  className = "",
}: ResponsiveTableProps) {
  // Desktop view
  const desktopView = (
    <div className="hidden md:block overflow-x-auto">
      <table className={`w-full text-sm ${className}`}>
        <thead className="border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left py-3 px-4 font-semibold text-slate-900 ${
                  col.className || ""
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-3 px-4 ${col.className || ""}`}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Mobile view - Card layout
  const mobileView = (
    <div className="md:hidden space-y-3">
      {data.map((row, idx) => (
        <div
          key={idx}
          className="bg-white border border-slate-200 rounded-lg p-4 space-y-2"
        >
          {columns.map((col) => (
            <div key={col.key} className="flex justify-between items-start gap-2">
              <span className="text-xs font-semibold text-slate-600">
                {col.label}
              </span>
              <span className="text-sm text-slate-900 text-right">
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {desktopView}
      {mobileView}
    </>
  );
}
