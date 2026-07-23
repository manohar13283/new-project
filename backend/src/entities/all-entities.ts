import { Factory } from './factory.entity';
import { Canteen } from './canteen.entity';
import { QrCode } from './qr-code.entity';
import { Department } from './department.entity';
import { Shift } from './shift.entity';
import { ShiftMealWindow } from './shift-meal-window.entity';
import { Worker } from './worker.entity';
import { MonthlyCouponAllocation } from './monthly-coupon-allocation.entity';
import { CouponTransaction } from './coupon-transaction.entity';
import { Feedback } from './feedback.entity';
import { MenuItem } from './menu-item.entity';
import { Holiday } from './holiday.entity';
import { Notification } from './notification.entity';
import { NotificationRecipient } from './notification-recipient.entity';
import { DeviceSession } from './device-session.entity';
import { Role } from './role.entity';
import { AdminUser } from './admin-user.entity';
import { AuditLog } from './audit-log.entity';

/** Explicit entity class list for TypeORM's `entities` option (the `./index` barrel also re-exports non-entity items like FeedbackCategory, which must not end up in this list). */
export const ALL_ENTITIES = [
  Factory,
  Canteen,
  QrCode,
  Department,
  Shift,
  ShiftMealWindow,
  Worker,
  MonthlyCouponAllocation,
  CouponTransaction,
  Feedback,
  MenuItem,
  Holiday,
  Notification,
  NotificationRecipient,
  DeviceSession,
  Role,
  AdminUser,
  AuditLog,
];
