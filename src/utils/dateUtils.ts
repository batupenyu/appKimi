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

  // Calculate the time difference in milliseconds
  const timeDiff = end.getTime() - start.getTime();
  
  // Convert time difference to days (milliseconds to days)
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  
  // Convert days to months (using average days per month: 30.44)
  // This accounts for leap years and varying month lengths
  const monthsDiff = daysDiff / 30.44;

  // Ensure we don't return negative months
  return Math.max(0, monthsDiff);
}