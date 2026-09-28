/**
 * Deterministic Pay-Date and Weekly Pay-Period Calculation Logic
 *
 * Rules:
 * 1. Nadia is paid every Tuesday.
 * 2. If a non-Tuesday date is picked, it snaps to the appropriate Tuesday.
 * 3. Weekly pay period is the immediately preceding Monday through Sunday:
 *    - Example: Pay Date Tuesday 09/22/2026 -> Start: Monday 09/14/2026, End: Sunday 09/20/2026
 *    - Example: Pay Date Tuesday 09/15/2026 -> Start: Monday 09/07/2026, End: Sunday 09/13/2026
 * 4. Pay period number: 1-based index of Tuesdays from Jan 1 of that calendar year.
 * 5. Sequential check number: deterministic based on period number (129114480 + periodNumber).
 */

export interface ResolvedPayDateInfo {
  payDate: string; // YYYY-MM-DD (Always Tuesday)
  startDate: string; // YYYY-MM-DD (Preceding Monday)
  endDate: string; // YYYY-MM-DD (Preceding Sunday)
  periodNumber: number; // 1-52
  totalPeriodsInYear: number;
  checkNumber: string;
}

// Helper to format Date to YYYY-MM-DD in UTC
function formatDateIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate all Tuesday pay dates in a given calendar year
export function getAllTuesdaysInYear(year: number): string[] {
  const tuesdays: string[] = [];
  // Start on Jan 1 of that year
  const curr = new Date(Date.UTC(year, 0, 1));
  
  // Find first Tuesday (getDay() === 2)
  while (curr.getUTCDay() !== 2) {
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  // Collect all Tuesdays within the year
  while (curr.getUTCFullYear() === year) {
    tuesdays.push(formatDateIso(curr));
    curr.setUTCDate(curr.getUTCDate() + 7);
  }

  return tuesdays;
}

/**
 * Resolves any input date to the corresponding Tuesday payday.
 * If the input is already a Tuesday, it is preserved.
 * Otherwise, it snaps to the Tuesday of that pay week.
 */
export function resolveToTuesday(dateStr: string): string {
  if (!dateStr) return '2026-09-22';
  
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return '2026-09-22';

  const date = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = date.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  if (dayOfWeek === 2) {
    return dateStr;
  }

  // Calculate difference to Tuesday (day 2)
  // If Wed(3), Thu(4), Fri(5), Sat(6) -> snap to this week's Tuesday (subtract 1, 2, 3, 4)
  // If Sun(0), Mon(1) -> snap to upcoming Tuesday (add 2, 1)
  let diff = 2 - dayOfWeek;
  if (dayOfWeek === 0) diff = 2; // Sunday -> upcoming Tuesday
  else if (dayOfWeek === 1) diff = 1; // Monday -> next day Tuesday
  else if (dayOfWeek > 2) diff = 2 - dayOfWeek; // Wed-Sat -> previous Tuesday of this week

  date.setUTCDate(date.getUTCDate() + diff);
  return formatDateIso(date);
}

/**
 * Computes the complete pay period details for a Tuesday pay date.
 */
export function getPayPeriodDetailsForTuesday(tuesdayStr: string): ResolvedPayDateInfo {
  const verifiedTuesday = resolveToTuesday(tuesdayStr);
  const [y, m, d] = verifiedTuesday.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const year = date.getUTCFullYear();

  // All Tuesdays in this year
  const allTuesdays = getAllTuesdaysInYear(year);
  let periodNumber = allTuesdays.indexOf(verifiedTuesday) + 1;
  if (periodNumber <= 0) {
    // Fallback if boundary date
    periodNumber = Math.min(52, Math.max(1, Math.ceil((date.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / (7 * 24 * 3600 * 1000))));
  }

  // Preceding Sunday is payDate - 2 days
  const endSunday = new Date(date);
  endSunday.setUTCDate(endSunday.getUTCDate() - 2);

  // Preceding Monday is payDate - 8 days (or endSunday - 6 days)
  const startMonday = new Date(date);
  startMonday.setUTCDate(startMonday.getUTCDate() - 8);

  const startDate = formatDateIso(startMonday);
  const endDate = formatDateIso(endSunday);

  // Deterministic check number: for 09/22/2026 (Period 38) it is 129114518
  // 129114480 + 38 = 129114518
  const baseCheck = 129114480;
  const checkNumber = (baseCheck + periodNumber).toString();

  return {
    payDate: verifiedTuesday,
    startDate,
    endDate,
    periodNumber,
    totalPeriodsInYear: allTuesdays.length,
    checkNumber,
  };
}
