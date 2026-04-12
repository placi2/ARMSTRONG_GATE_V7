import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  unit?: string;
  icon?: ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <Card className={`bg-white ${className}`}>
      <CardContent className="pt-4 md:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-medium text-slate-600 mb-2">{title}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-2xl md:text-3xl font-bold text-slate-900">{value}</p>
              {unit && <p className="text-xs md:text-sm text-slate-500">{unit}</p>}
            </div>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-3">
                {trend === "up" ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
