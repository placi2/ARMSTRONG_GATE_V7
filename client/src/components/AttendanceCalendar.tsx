import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "half-day" | "none";
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  month?: number;
  year?: number;
  onMonthChange?: (month: number, year: number) => void;
}

export default function AttendanceCalendar({
  records,
  month = new Date().getMonth(),
  year = new Date().getFullYear(),
  onMonthChange,
}: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(month);
  const [currentYear, setCurrentYear] = useState(year);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
      onMonthChange?.(11, currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
      onMonthChange?.(currentMonth - 1, currentYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
      onMonthChange?.(0, currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
      onMonthChange?.(currentMonth + 1, currentYear);
    }
  };

  const getDaysInMonth = () => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(currentYear, currentMonth, 1).getDay();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 border-green-300 text-green-900";
      case "absent":
        return "bg-red-100 border-red-300 text-red-900";
      case "half-day":
        return "bg-orange-100 border-orange-300 text-orange-900";
      default:
        return "bg-slate-50 border-slate-200 text-slate-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "✓ Présent";
      case "absent":
        return "✗ Absent";
      case "half-day":
        return "½ Demi-journée";
      default:
        return "";
    }
  };

  const getRecordForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return records.find((r) => r.date === dateStr);
  };

  const calculateStats = () => {
    const monthRecords = records.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const present = monthRecords.filter((r) => r.status === "present").length;
    const absent = monthRecords.filter((r) => r.status === "absent").length;
    const halfDay = monthRecords.filter((r) => r.status === "half-day").length;

    return { present, absent, halfDay };
  };

  const stats = calculateStats();
  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const days = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="p-2"></div>);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const record = getRecordForDate(day);
    const status = record?.status || "none";

    days.push(
      <div
        key={day}
        className={`p-2 border rounded-lg text-center font-semibold transition-colors ${getStatusColor(status)}`}
        title={getStatusLabel(status)}
      >
        <div className="text-lg">{day}</div>
        <div className="text-xs mt-1">
          {status === "present" && "✓"}
          {status === "absent" && "✗"}
          {status === "half-day" && "½"}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-600" />
          </button>

          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900">
              {monthNames[currentMonth]} {currentYear}
            </h3>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-slate-600 mb-1">Jours Présents</p>
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-slate-600 mb-1">Jours Absents</p>
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-slate-600 mb-1">Demi-journées</p>
            <p className="text-2xl font-bold text-orange-600">{stats.halfDay}</p>
          </div>
        </div>

        {/* Calendar */}
        <div>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-slate-600 text-sm p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">{days}</div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-slate-600">Présent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm text-slate-600">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-sm text-slate-600">Demi-journée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded"></div>
            <span className="text-sm text-slate-600">Non renseigné</span>
          </div>
        </div>
      </div>
    </div>
  );
}
