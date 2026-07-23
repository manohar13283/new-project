import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Worker } from './worker.entity';

@Entity('device_session')
@Unique('uq_worker_device', ['workerId', 'deviceId'])
export class DeviceSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Worker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'worker_id' })
  worker: Worker;

  @Column({ name: 'worker_id' })
  workerId: string;

  @Column({ name: 'device_id' })
  deviceId: string;

  @Column({ name: 'refresh_token_hash' })
  refreshTokenHash: string;

  @Column({ type: 'timestamptz', name: 'last_seen_at' })
  lastSeenAt: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;
}
