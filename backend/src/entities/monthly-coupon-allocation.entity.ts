import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Worker } from './worker.entity';

@Entity('monthly_coupon_allocation')
@Unique('uq_worker_month', ['workerId', 'year', 'month'])
@Index(['year', 'month'])
export class MonthlyCouponAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Worker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'worker_id' })
  worker: Worker;

  @Column({ name: 'worker_id' })
  workerId: string;

  @Column()
  year: number;

  @Column()
  month: number;

  @Column({ name: 'breakfast_tea_total', default: 26 })
  breakfastTeaTotal: number;

  @Column({ name: 'breakfast_tea_used', default: 0 })
  breakfastTeaUsed: number;

  @Column({ name: 'meal_total', default: 26 })
  mealTotal: number;

  @Column({ name: 'meal_used', default: 0 })
  mealUsed: number;

  @Column({ name: 'tea_total', default: 26 })
  teaTotal: number;

  @Column({ name: 'tea_used', default: 0 })
  teaUsed: number;

  @Column({ type: 'timestamptz', name: 'generated_at' })
  generatedAt: Date;
}
