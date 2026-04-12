import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Search, X, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string; label: string; subtitle?: string;
}

interface Props {
  options: SelectOption[]; value: string;
  onChange: (v: string) => void; placeholder?: string;
  disabled?: boolean; className?: string; emptyMsg?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "Sélectionner...", disabled = false, className = "", emptyMsg = "Aucun résultat" }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.subtitle || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { setHi(0); }, [search]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick = (opt: SelectOption) => { onChange(opt.value); setOpen(false); setSearch(""); };
  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(""); setSearch(""); };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter" && filtered[hi]) pick(filtered[hi]);
    if (e.key === "Escape") { setOpen(false); setSearch(""); }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={() => { if (!disabled) { setOpen(o => !o); if (!open) setTimeout(() => inputRef.current?.focus(), 50); } }}
        className={`flex items-center gap-2 w-full border rounded-lg px-3 py-2 text-sm cursor-pointer select-none ${
          open ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-300 hover:border-slate-400"
        } ${disabled ? "bg-slate-50 cursor-not-allowed opacity-60" : "bg-white"}`}
      >
        {open ? (
          <>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={onKey}
              placeholder="Rechercher..." className="flex-1 outline-none bg-transparent" onClick={e => e.stopPropagation()} />
          </>
        ) : (
          <>
            <span className={`flex-1 truncate ${selected ? "text-slate-900" : "text-slate-400"}`}>
              {selected ? selected.label : placeholder}
            </span>
            {selected && <button onClick={clear} className="text-slate-400 hover:text-slate-600 p-0.5 rounded"><X size={12} /></button>}
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          </>
        )}
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-400 text-center">
              <Search size={16} className="mx-auto mb-1 opacity-40" />{emptyMsg}
            </div>
          ) : filtered.map((opt, i) => (
            <div key={opt.value} onClick={() => pick(opt)} onMouseEnter={() => setHi(i)}
              className={`px-3 py-2.5 cursor-pointer border-b border-slate-50 last:border-0 ${
                i === hi ? "bg-amber-50" : "hover:bg-slate-50"
              } ${opt.value === value ? "font-medium" : ""}`}>
              <div className="text-sm text-slate-900">{opt.label}</div>
              {opt.subtitle && <div className="text-xs text-slate-400 mt-0.5">{opt.subtitle}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
