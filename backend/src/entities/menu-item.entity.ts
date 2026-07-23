import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CouponType } from '../common/enums/coupon-type.enum';
import { Canteen } from './canteen.entity';
import { Shift } from './shift.entity';

@Entity('menu_item')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Canteen, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'canteen_id' })
  canteen: Canteen;

  @Column({ name: 'canteen_id' })
  canteenId: string;

  @Column({ type: 'date', name: 'served_date' })
  servedDate: string;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ name: 'shift_id' })
  shiftId: string;

  @Column({ type: 'enum', enum: CouponType, name: 'coupon_type' })
  couponType: CouponType;

  @Column()
  description: string;
}
