/** Packed before 1936 so the later stations keep today's spacing. */
export const YEAR_MIN = 1889
export const YEAR_MAX = 2026
export const YEAR_KNEE = 1936
const FRONT = 0.125

export function yearToT(year: number): number {
  const clamped = Math.min(YEAR_MAX, Math.max(YEAR_MIN, year))
  if (clamped <= YEAR_KNEE) {
    return ((clamped - YEAR_MIN) / (YEAR_KNEE - YEAR_MIN)) * FRONT
  }
  return FRONT + ((clamped - YEAR_KNEE) / (YEAR_MAX - YEAR_KNEE)) * (1 - FRONT)
}

export function tToYear(t: number): number {
  const u = Math.min(1, Math.max(0, t))
  if (u <= FRONT) return Math.round(YEAR_MIN + (u / FRONT) * (YEAR_KNEE - YEAR_MIN))
  return Math.round(YEAR_KNEE + ((u - FRONT) / (1 - FRONT)) * (YEAR_MAX - YEAR_KNEE))
}
