/**
 * Calculate the number of months between two dates
 * @param startDate The start date string (YYYY-MM-DD)
 * @param endDate The end date string (YYYY-MM-DD)
 * @returns Number of months between the two dates
 */
export function calculateMonthsBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate the difference in years and months
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  
  // Total months difference (inclusive of both start and end months)
  let totalMonths = yearDiff * 12 + monthDiff;

  // Add 1 to make it inclusive (Jan to Dec = 12 months, not 11)
  // This assumes that partial months count as full months for credit calculations
  totalMonths += 1;

  return Math.max(0, totalMonths);
}