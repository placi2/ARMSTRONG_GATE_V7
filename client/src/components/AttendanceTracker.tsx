import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarCheck } from "lucide-react";
import { toast } from "sonner";

type Status = "present" | "absent" | "half" | null;

interface Props {
  employeeId: string;
  employeeName: string;
  onClose?: () => void;
}

function getKey(empId: string, year: number, month: number) {
  return `att_${empId}_${year}_${month}`;
}

// Get today's date components
function getToday() {
  const d = new Date();
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    dateStr: d.toISOString().split("T")[0],
  };
}

export default function AttendanceTracker({ employeeId, employeeName, onClose }: Props) {
  const [open, setOpen] = useState(false);
  const today = getToday();
  const [viewYear, setViewYear] = useState(today.year);
  const [viewMonth, setViewMonth] = useState(today.month);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});

  useEffect(() => {
    if (!open) return;
    try {
      const key = getKey(employeeId, viewYear, viewMonth);
      const stored = localStorage.getItem(key);
      setAttendance(stored ? JSON.parse(stored) : {});
    } catch { setAttendance({}); }
  }, [employeeId, viewYear, viewMonth, open]);

  const save = (data: Record<string, Status>) => {
    setAttendance(data);
    try {
      localStorage.setItem(getKey(employeeId, viewYear, viewMonth), JSON.stringify(data));
    } catch {}
  };

  const mark = (day: number, status: Status) => {
    // BLOCK FUTURE DATES
    const clickedDate = new Date(viewYear, viewMonth, day);
    const todayDate = new Date(today.year, today.month, today.day);
    
    if (clickedDate > todayDate) {
      toast.error("Impossible de pointer une date future !");
      return;
    }

    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const updated = { ...attendance, [dateStr]: status };
    save(updated);
    toast.success(`${status === "present" ? "✓ Présent" : status === "absent" ? "✗ Absent" : "½ Demi-journée"} — ${day}/${viewMonth+1}/${viewYear}`);
  };

  const getStatus = (day: number): Status => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendance[dateStr] || null;
  };

  const isFuture = (day: number): boolean => {
    const clickedDate = new Date(viewYear, viewMonth, day);
    const todayDate = new Date(today.year, today.month, today.day);
    return clickedDate > todayDate;
  };

  const isToday = (day: number): boolean => {
    return viewYear === today.year && viewMonth === today.month && day === today.day;
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const MONTHS = ["Janv","Févr","Mars","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
  const DAYS = ["Di","Lu","Ma","Me","Je","Ve","Sa"];

  const values = Object.values(attendance);
  const present = values.filter(v => v === "present").length;
  const half = values.filter(v => v === "half").length;
  const absent = values.filter(v => v === "absent").length;

  const goMonth = (dir: number) => {
    const newDate = new Date(viewYear, viewMonth + dir, 1);
    // Don't allow navigating to future months
    const todayFirstOfMonth = new Date(today.year, today.month, 1);
    if (newDate > todayFirstOfMonth) {
      toast.error("Impossible d'aller dans un mois futur");
      return;
    }
    setViewMonth(newDate.getMonth());
    setViewYear(newDate.getFullYear());
  };

  const isCurrentMonth = viewYear === today.year && viewMonth === today.month;

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o && onClose) onClose(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50">
          <CalendarCheck size={14} className="mr-1" /> Pointer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Pointage — {employeeName}</DialogTitle>
        </DialogHeader>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => goMonth(-1)} className="px-3 py-1 border rounded hover:bg-slate-50 text-sm">←</button>
          <div className="text-center">
            <span className="font-semibold">{MONTHS[viewMonth]} {viewYear}</span>
            {isCurrentMonth && <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Mois actuel</span>}
          </div>
          <button onClick={() => goMonth(1)}
            className={`px-3 py-1 border rounded text-sm ${isCurrentMonth ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50"}`}
            disabled={isCurrentMonth}>
            →
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { l: "Présents", v: present, c: "text-green-600 bg-green-50" },
            { l: "½ Journées", v: half, c: "text-orange-600 bg-orange-50" },
            { l: "Absents", v: absent, c: "text-red-600 bg-red-50" },
          ].map(s => (
            <div key={s.l} className={`${s.c} rounded-lg p-2 text-center`}>
              <p className={`text-xl font-bold`}>{s.v}</p>
              <p className="text-xs">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Future date warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-2">
          ⚠️ Les dates futures (grisées) ne peuvent pas être pointées.
          Aujourd'hui: <strong>{today.day}/{today.month+1}/{today.year}</strong>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-slate-500 justify-center mb-2">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"/>Présent</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"/>½ Jour</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/>Absent</span>
        </div>

        {/* Calendar */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {DAYS.map(d => <div key={d} className="font-semibold text-slate-400 py-1">{d}</div>)}
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const status = getStatus(day);
            const future = isFuture(day);
            const todayDay = isToday(day);
            return (
              <div key={day}
                className={`rounded-lg p-1 border-2 transition-all ${
                  future ? "opacity-30 cursor-not-allowed bg-slate-100 border-transparent" :
                  status === "present" ? "bg-green-100 border-green-400 text-green-700" :
                  status === "absent" ? "bg-red-100 border-red-400 text-red-700" :
                  status === "half" ? "bg-orange-100 border-orange-400 text-orange-700" :
                  todayDay ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200" :
                  "border-transparent bg-slate-50 hover:border-slate-200"
                }`}>
                <div className="font-medium">{day}</div>
                {!future && (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    <button onClick={() => mark(day, "present")} title="Présent"
                      className="w-2.5 h-2.5 rounded-full bg-green-500 hover:scale-125 transition-transform" />
                    <button onClick={() => mark(day, "half")} title="½ journée"
                      className="w-2.5 h-2.5 rounded-full bg-orange-500 hover:scale-125 transition-transform" />
                    <button onClick={() => mark(day, "absent")} title="Absent"
                      className="w-2.5 h-2.5 rounded-full bg-red-500 hover:scale-125 transition-transform" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 text-center mt-2">
          Données sauvegardées automatiquement par mois/année.
        </p>
      </DialogContent>
    </Dialog>
  );
}
