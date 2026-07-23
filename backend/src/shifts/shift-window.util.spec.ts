import { ShiftMealWindow } from '../entities/shift-meal-window.entity';
import { CouponType } from '../common/enums/coupon-type.enum';
import { findOpenWindow, isWithinWindow, resolveBusinessDate } from './shift-window.util';

function window(overrides: Partial<ShiftMealWindow>): ShiftMealWindow {
  return {
    id: 'w1',
    shiftId: 's1',
    couponType: CouponType.MEAL,
    startTime: '11:30',
    endTime: '14:00',
    crossesMidnight: false,
    ...overrides,
  } as ShiftMealWindow;
}

describe('shift-window.util', () => {
  it('detects a time within a same-day window', () => {
    expect(isWithinWindow('12:00', '11:30', '14:00')).toBe(true);
    expect(isWithinWindow('10:00', '11:30', '14:00')).toBe(false);
  });

  it('detects a time within a small early-morning window (start < end, no wrap)', () => {
    expect(isWithinWindow('01:45', '01:30', '02:30')).toBe(true);
    expect(isWithinWindow('12:00', '01:30', '02:30')).toBe(false);
  });

  it('detects a time within a genuinely midnight-wrapping window (start > end)', () => {
    expect(isWithinWindow('23:50', '22:00', '02:30')).toBe(true);
    expect(isWithinWindow('01:00', '22:00', '02:30')).toBe(true);
    expect(isWithinWindow('12:00', '22:00', '02:30')).toBe(false);
  });

  it('finds the open window for a coupon type at a given time', () => {
    const windows = [
      window({ couponType: CouponType.BREAKFAST_TEA, startTime: '08:30', endTime: '09:30' }),
      window({ couponType: CouponType.MEAL, startTime: '11:30', endTime: '14:00' }),
    ];
    expect(findOpenWindow(windows, CouponType.MEAL, '12:00')?.couponType).toBe(CouponType.MEAL);
    expect(findOpenWindow(windows, CouponType.MEAL, '10:00')).toBeUndefined();
  });

  it('rejects a redemption attempted outside its window (no match returned)', () => {
    const windows = [window({ couponType: CouponType.MEAL, startTime: '11:30', endTime: '14:00' })];
    expect(findOpenWindow(windows, CouponType.MEAL, '15:00')).toBeUndefined();
  });

  it('rolls a post-midnight crossing window back to the previous business date', () => {
    const w = window({ crossesMidnight: true, startTime: '01:30', endTime: '02:30' });
    const now = new Date('2026-07-23T02:00:00Z');
    expect(resolveBusinessDate(now, w)).toBe('2026-07-22');
  });

  it('keeps the same-day business date for non-crossing windows', () => {
    const w = window({ crossesMidnight: false });
    const now = new Date('2026-07-23T12:00:00Z');
    expect(resolveBusinessDate(now, w)).toBe('2026-07-23');
  });
});
