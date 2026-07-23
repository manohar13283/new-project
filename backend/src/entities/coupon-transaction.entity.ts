import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CouponType, RejectReason, TransactionStatus } from '../common/enums/coupon-type.enum';
import { Worker } from './worker.entity';
import { Shift } from './shift.entity';
import { ShiftMealWindow } from './shift-meal-window.entity';
import { Canteen } from './canteen.entity';
import { QrCode } from './qr-code.entity';

/**
 * A unique partial index (see migration 1690000000002) enforces at the DB
 * level that only one SUCCESS row can exist per (worker, couponType,
 * businessDate) - the authoritative duplicate-scan guard even under
 * concurrent requests across replicas.
 */
@Entity('coupon_transaction')
@Index(['workerId', 'businessDate'])
export class CouponTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Worker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'worker_id' })
  worker: Worker;

  @Column({ name: 'worker_id' })
  workerId: string;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ name: 'shift_id' })
  shiftId: string;

  @ManyToOne(() => ShiftMealWindow, { nullable: true })
  @JoinColumn({ name: 'shift_meal_window_id' })
  shiftMealWindow: ShiftMealWindow | null;

  @Column({ name: 'shift_meal_window_id', nullable: true })
  shiftMealWindowId: string | null;

  @ManyToOne(() => Canteen)
  @JoinColumn({ name: 'canteen_id' })
  canteen: Canteen;

  @Column({ name: 'canteen_id' })
  canteenId: string;

  @ManyToOne(() => QrCode)
  @JoinColumn({ name: 'qr_code_id' })
  qrCode: QrCode;

  @Column({ name: 'qr_code_id' })
  qrCodeId: string;

  @Column({ type: 'enum', enum: CouponType, name: 'coupon_type' })
  couponType: CouponType;

  @Column({ type: 'date', name: 'business_date' })
  businessDate: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'scanned_at' })
  scannedAt: Date;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ type: 'enum', enum: RejectReason, name: 'reject_reason', nullable: true })
  rejectReason: RejectReason | null;

  @Column({ name: 'device_id', nullable: true })
  deviceId: string;
}
