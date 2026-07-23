import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CouponType } from '../common/enums/coupon-type.enum';
import { Shift } from './shift.entity';

/**
 * start_time/end_time are stored as HH:mm strings (24h). crossesMidnight marks
 * windows like the 3rd shift's 01:30-02:30 that fall after midnight relative
 * to the shift's operational business_date.
 */
@Entity('shift_meal_window')
@Index(['shift', 'couponType'])
export class ShiftMealWindow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Shift, (shift) => shift.mealWindows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ name: 'shift_id' })
  shiftId: string;

  @Column({ type: 'enum', enum: CouponType, name: 'coupon_type' })
  couponType: CouponType;

  @Column({ name: 'start_time', type: 'varchar', length: 5 })
  startTime: string;

  @Column({ name: 'end_time', type: 'varchar', length: 5 })
  endTime: string;

  @Column({ name: 'crosses_midnight', default: false })
  crossesMidnight: boolean;
}
