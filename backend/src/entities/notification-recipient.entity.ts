import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Notification } from './notification.entity';
import { Worker } from './worker.entity';

@Entity('notification_recipient')
export class NotificationRecipient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Notification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column({ name: 'notification_id' })
  notificationId: string;

  @ManyToOne(() => Worker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'worker_id' })
  worker: Worker;

  @Column({ name: 'worker_id' })
  workerId: string;

  @Column({ default: false })
  read: boolean;
}
