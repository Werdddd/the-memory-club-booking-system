import { formatCurrency } from "@/lib/utils";

export function PricingTiers({
  dailyRate,
  extendedDailyRate,
  className,
}: {
  dailyRate: number;
  extendedDailyRate: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <p>
        {formatCurrency(dailyRate)}{" "}
        <span className="text-muted-foreground">per day (1-3 days)</span>
      </p>
      <p>
        {formatCurrency(extendedDailyRate)}{" "}
        <span className="text-muted-foreground">per day (4+ days)</span>
      </p>
    </div>
  );
}
