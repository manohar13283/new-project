import { ShiftMealWindow } from '../entities/shift-meal-window.entity';
import { CouponType } from '../common/enums/coupon-type.enum';

export function toHHMM(date: Date): string {
  return date.toISOString().substring(11, 16);
}

/**
 * Returns true if `hhmm` falls within [start, end]. Wrap-around (e.g. a window
 * spanning 22:00-02:30) is inferred from start > end, not from the entity's
 * crossesMidnight flag - that flag only affects business-date resolution
 * (see resolveBusinessDate), since a window like 01:30-02:30 doesn't actually
 * straddle midnight even though it's "morning-side" of a shift that runs late.
 */
export function isWithinWindow(hhmm: string, start: string, end: string): boolean {
  if (start <= end) {
    return hhmm >= start && hhmm <= end;
  }
  return hhmm >= start || hhmm <= end;
}

export function findOpenWindow(
  windows: ShiftMealWindow[],
  couponType: CouponType,
  nowHHMM: string,
): ShiftMealWindow | undefined {
  return windows.find((w) => w.couponType === couponType && isWithinWindow(nowHHMM, w.startTime, w.endTime));
}

export function findWindowForType(windows: ShiftMealWindow[], couponType: CouponType): ShiftMealWindow | undefined {
  return windows.find((w) => w.couponType === couponType);
}

export function formatWindow(window: ShiftMealWindow): string {
  return `${to12h(window.startTime)} - ${to12h(window.endTime)}`;
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Business date for the redemption. Windows flagged crossesMidnight (e.g. the
 * 3rd-shift 01:30-02:30 Tea window) that fire in the early hours are counted
 * against the *previous* calendar day's shift, since operationally that is
 * still "last night's" 3rd shift.
 */
export function resolveBusinessDate(now: Date, window: ShiftMealWindow | undefined): string {
  const today = now.toISOString().substring(0, 10);
  if (!window?.crossesMidnight) return today;

  const hhmm = toHHMM(now);
  // If we're in the post-midnight portion of the window (00:00-11:59), it belongs to "yesterday".
  if (hhmm < '12:00') {
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return yesterday.toISOString().substring(0, 10);
  }
  return today;
}
