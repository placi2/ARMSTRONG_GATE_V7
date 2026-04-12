import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

export interface ComparisonPeriods {
  period1Start: string;
  period1End: string;
  period2Start: string;
  period2End: string;
}

interface PeriodComparisonFiltersProps {
  onPeriodsChange: (periods: ComparisonPeriods) => void;
}

export default function PeriodComparisonFilters({
  onPeriodsChange,
}: PeriodComparisonFiltersProps) {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const previousMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1
  )
    .toISOString()
    .split("T")[0];
  const previousMonthEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    0
  )
    .toISOString()
    .split("T")[0];

  const [periods, setPeriods] = useState<ComparisonPeriods>({
    period1Start: previousMonthStart,
    period1End: previousMonthEnd,
    period2Start: currentMonth,
    period2End: today,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handlePeriodChange = (key: keyof ComparisonPeriods, value: string) => {
    const newPeriods = { ...periods, [key]: value };
    setPeriods(newPeriods);
    onPeriodsChange(newPeriods);
  };

  const handleQuickSelect = (preset: string) => {
    const today = new Date();
    let newPeriods: ComparisonPeriods;

    switch (preset) {
      case "lastMonth":
        const lastMonthStart = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        const twoMonthsAgoStart = new Date(
          today.getFullYear(),
          today.getMonth() - 2,
          1
        );
        const twoMonthsAgoEnd = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          0
        );
        newPeriods = {
          period1Start: twoMonthsAgoStart.toISOString().split("T")[0],
          period1End: twoMonthsAgoEnd.toISOString().split("T")[0],
          period2Start: lastMonthStart.toISOString().split("T")[0],
          period2End: lastMonthEnd.toISOString().split("T")[0],
        };
        break;

      case "lastQuarter":
        const currentQuarterStart = new Date(
          today.getFullYear(),
          Math.floor(today.getMonth() / 3) * 3,
          1
        );
        const lastQuarterStart = new Date(
          today.getFullYear(),
          Math.floor(today.getMonth() / 3) * 3 - 3,
          1
        );
        const lastQuarterEnd = new Date(
          today.getFullYear(),
          Math.floor(today.getMonth() / 3) * 3,
          0
        );
        newPeriods = {
          period1Start: lastQuarterStart.toISOString().split("T")[0],
          period1End: lastQuarterEnd.toISOString().split("T")[0],
          period2Start: currentQuarterStart.toISOString().split("T")[0],
          period2End: today.toISOString().split("T")[0],
        };
        break;

      case "lastYear":
        const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
        const currentYearStart = new Date(today.getFullYear(), 0, 1);
        newPeriods = {
          period1Start: lastYearStart.toISOString().split("T")[0],
          period1End: lastYearEnd.toISOString().split("T")[0],
          period2Start: currentYearStart.toISOString().split("T")[0],
          period2End: today.toISOString().split("T")[0],
        };
        break;

      default:
        return;
    }

    setPeriods(newPeriods);
    onPeriodsChange(newPeriods);
  };

  return (
    <Card className="bg-white border border-slate-200">
      <CardContent className="pt-6">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            <span className="font-semibold text-slate-900">
              Comparaison de Périodes
            </span>
          </div>
          <div className="text-slate-500">{isExpanded ? "▼" : "▶"}</div>
        </div>

        {isExpanded && (
          <div className="mt-6 space-y-4 pt-6 border-t border-slate-200">
            {/* Quick Select Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleQuickSelect("lastMonth")}
                variant="outline"
                size="sm"
              >
                Mois Dernier
              </Button>
              <Button
                onClick={() => handleQuickSelect("lastQuarter")}
                variant="outline"
                size="sm"
              >
                Trimestre Dernier
              </Button>
              <Button
                onClick={() => handleQuickSelect("lastYear")}
                variant="outline"
                size="sm"
              >
                Année Dernière
              </Button>
            </div>

            {/* Period 1 */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-slate-900">Période 1</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="p1-start" className="text-sm font-medium">
                    Date Début
                  </Label>
                  <Input
                    id="p1-start"
                    type="date"
                    value={periods.period1Start}
                    onChange={(e) =>
                      handlePeriodChange("period1Start", e.target.value)
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p1-end" className="text-sm font-medium">
                    Date Fin
                  </Label>
                  <Input
                    id="p1-end"
                    type="date"
                    value={periods.period1End}
                    onChange={(e) =>
                      handlePeriodChange("period1End", e.target.value)
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Period 2 */}
            <div className="bg-green-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-slate-900">Période 2</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="p2-start" className="text-sm font-medium">
                    Date Début
                  </Label>
                  <Input
                    id="p2-start"
                    type="date"
                    value={periods.period2Start}
                    onChange={(e) =>
                      handlePeriodChange("period2Start", e.target.value)
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p2-end" className="text-sm font-medium">
                    Date Fin
                  </Label>
                  <Input
                    id="p2-end"
                    type="date"
                    value={periods.period2End}
                    onChange={(e) =>
                      handlePeriodChange("period2End", e.target.value)
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => setIsExpanded(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Appliquer la Comparaison
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
