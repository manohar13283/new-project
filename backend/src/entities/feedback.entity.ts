import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CouponTransaction } from './coupon-transaction.entity';
import { Worker } from './worker.entity';

export enum FeedbackCategory {
  FOOD_QUALITY = 'FOOD_QUALITY',
  TEA_QUALITY = 'TEA_QUALITY',
  BREAKFAST_QUALITY = 'BREAKFAST_QUALITY',
  CLEANLINESS = 'CLEANLINESS',
  STAFF_BEHAVIOUR = 'STAFF_BEHAVIOUR',
  WAITING_TIME = 'WAITING_TIME',
  SUGGESTIONS = 'SUGGESTIONS',
}

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => CouponTransaction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: CouponTransaction;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @ManyToOne(() => Worker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'worker_id' })
  worker: Worker;

  @Column({ name: 'worker_id' })
  workerId: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  categories: FeedbackCategory[];

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
