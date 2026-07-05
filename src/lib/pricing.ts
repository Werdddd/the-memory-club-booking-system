/** Number of billable rental days between a pickup and return instant, minimum 1. */
export function rentalDays(pickup: Date, returnAt: Date): number {
  const ms = returnAt.getTime() - pickup.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
}

/** 1-3 days uses the standard rate; 4+ days uses the discounted extended rate. */
export function tieredDailyRate(
  item: { daily_rate: number; extended_daily_rate: number },
  days: number
) {
  return days >= 4 ? item.extended_daily_rate : item.daily_rate;
}
