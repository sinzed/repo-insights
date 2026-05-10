import { describe, expect, it } from 'vitest';

import { isCalendarDateString } from './calendar-date-string';

describe('isCalendarDateString', () => {
  it('accepts valid UTC calendar dates', () => {
    expect(isCalendarDateString('2026-05-01')).toBe(true);
    expect(isCalendarDateString('2024-02-29')).toBe(true);
  });

  it('rejects invalid Gregorian dates', () => {
    expect(isCalendarDateString('2025-02-29')).toBe(false);
    expect(isCalendarDateString('2026-13-01')).toBe(false);
    expect(isCalendarDateString('2026-00-10')).toBe(false);
  });

  it('rejects non YYYY-MM-DD shapes', () => {
    expect(isCalendarDateString('')).toBe(false);
    expect(isCalendarDateString('2026/05/01')).toBe(false);
    expect(isCalendarDateString('01-05-2026')).toBe(false);
  });
});
