import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'audience_filter', type: 'jsonb', nullable: true })
  audienceFilter: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'sent_at' })
  sentAt: Date;
}
