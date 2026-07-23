export type CouponType = 'BREAKFAST_TEA' | 'MEAL' | 'TEA';

export interface TodayCoupon {
  type: CouponType;
  window: string | null;
  isOpenNow: boolean;
  remaining: number;
  usedToday: boolean;
}

export interface TodayCouponsResponse {
  businessDate: string;
  shift: string;
  coupons: TodayCoupon[];
}
