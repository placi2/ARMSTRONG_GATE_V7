import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  total: number; page: number; perPage: number;
  onPageChange: (p: number) => void; onPerPageChange: (n: number) => void;
}

export default function Pagination({ total, page, perPage, onPageChange, onPerPageChange }: Props) {
  const totalPages = perPage === 0 ? 1 : Math.max(1, Math.ceil(total / perPage));
  const start = perPage === 0 ? 1 : Math.min((page - 1) * perPage + 1, total);
  const end = perPage === 0 ? total : Math.min(page * perPage, total);
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>Afficher</span>
        <select value={perPage === 0 ? "all" : perPage}
          onChange={e => { onPerPageChange(e.target.value === "all" ? 0 : parseInt(e.target.value)); onPageChange(1); }}
          className="border border-slate-200 rounded px-2 py-1 text-xs bg-white">
          <option value={10}>10</option><option value={25}>25</option>
          <option value={50}>50</option><option value="all">Tous</option>
        </select>
        <span className="text-xs">{start}–{end} / {total}</span>
      </div>
      {perPage > 0 && totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1} className="h-7 w-7 p-0"><ChevronLeft size={13} /></Button>
          <span className="px-2 text-xs text-slate-500">{page}/{totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="h-7 w-7 p-0"><ChevronRight size={13} /></Button>
        </div>
      )}
    </div>
  );
}

export function usePagination<T>(items: T[], defaultPerPage = 10) {
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(defaultPerPage);
  const handlePP = (n: number) => { setPerPage(n); setPage(1); };
  const paginated = perPage === 0 ? items : items.slice((page - 1) * perPage, page * perPage);
  return { page, perPage, paginated, total: items.length, setPage, setPerPage: handlePP };
}
