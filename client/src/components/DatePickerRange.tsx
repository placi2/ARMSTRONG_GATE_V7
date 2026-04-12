import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatePickerRangeProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
  showMonthSelector?: boolean;
}

export default function DatePickerRange({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Période",
  showMonthSelector = true,
}: DatePickerRangeProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDayClick = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayStr}`;

    if (selectingStart) {
      onStartDateChange(dateStr);
      setSelectingStart(false);
    } else {
      if (dateStr >= startDate) {
        onEndDateChange(dateStr);
      } else {
        // Si la date est avant la date de début, inverser
        onStartDateChange(dateStr);
        onEndDateChange(startDate);
      }
      setShowCalendar(false);
    }
  };

  const handleMonthClick = (month: number) => {
    const year = currentMonth.getFullYear();
    const monthStr = String(month).padStart(2, "0");
    const dateStr = `${year}-${monthStr}-01`;

    if (selectingStart) {
      onStartDateChange(dateStr);
      setSelectingStart(false);
    } else {
      const lastDay = new Date(year, month, 0).getDate();
      const endDateStr = `${year}-${monthStr}-${lastDay}`;
      if (dateStr >= startDate) {
        onEndDateChange(endDateStr);
      } else {
        onStartDateChange(dateStr);
        onEndDateChange(startDate);
      }
      setShowCalendar(false);
    }
  };

  const handleYearClick = (year: number) => {
    const dateStr = `${year}-01-01`;
    const endDateStr = `${year}-12-31`;

    if (selectingStart) {
      onStartDateChange(dateStr);
      setSelectingStart(false);
    } else {
      if (dateStr >= startDate) {
        onEndDateChange(endDateStr);
      } else {
        onStartDateChange(dateStr);
        onEndDateChange(endDateStr);
      }
      setShowCalendar(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${year}-${month}-${dayStr}`;

      const isStart = dateStr === startDate;
      const isEnd = dateStr === endDate;
      const isBetween = dateStr > startDate && dateStr < endDate;

      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(day)}
          className={`p-2 text-sm font-medium rounded transition-colors ${
            isStart || isEnd
              ? "bg-amber-500 text-white"
              : isBetween
                ? "bg-amber-100 text-slate-900"
                : "hover:bg-slate-100 text-slate-900"
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const renderMonthSelector = () => {
    const months = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Août",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];
    return (
      <div className="grid grid-cols-4 gap-2 p-4">
        {months.map((month, idx) => (
          <button
            key={month}
            onClick={() => handleMonthClick(idx + 1)}
            className="p-2 text-sm font-medium rounded hover:bg-amber-100 transition-colors"
          >
            {month}
          </button>
        ))}
      </div>
    );
  };

  const renderYearSelector = () => {
    const currentYear = currentMonth.getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
    return (
      <div className="grid grid-cols-4 gap-2 p-4">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => handleYearClick(year)}
            className="p-2 text-sm font-medium rounded hover:bg-amber-100 transition-colors"
          >
            {year}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 text-sm flex items-center gap-2 hover:border-amber-400 transition-colors"
          >
            <Calendar size={18} />
            <span>
              {startDate ? formatDate(startDate) : "Début"} → {endDate ? formatDate(endDate) : "Fin"}
            </span>
          </button>
        </div>
      </div>

      {showCalendar && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-4 w-80">
          {/* Header with month/year navigation */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <p className="font-semibold text-slate-900">
                {currentMonth.toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {selectingStart ? "Sélectionner la date de début" : "Sélectionner la date de fin"}
              </p>
            </div>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Tabs for calendar/month/year selection */}
          <div className="flex gap-2 mb-4 border-b border-slate-200">
            <button className="px-3 py-2 text-sm font-medium border-b-2 border-amber-500 text-amber-600">
              Jour
            </button>
            {showMonthSelector && (
              <>
                <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                  Mois
                </button>
                <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                  Année
                </button>
              </>
            )}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-slate-600 p-2">
                {day}
              </div>
            ))}
            {renderCalendar()}
          </div>

          {/* Quick selection buttons */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                onStartDateChange(today);
                onEndDateChange(today);
                setShowCalendar(false);
              }}
              className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0];
                const todayStr = today.toISOString().split("T")[0];
                onStartDateChange(weekAgo);
                onEndDateChange(todayStr);
                setShowCalendar(false);
              }}
              className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              7 jours
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0];
                const todayStr = today.toISOString().split("T")[0];
                onStartDateChange(monthAgo);
                onEndDateChange(todayStr);
                setShowCalendar(false);
              }}
              className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              30 jours
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
