import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Canteen } from './canteen.entity';

@Entity('qr_code')
export class QrCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Canteen, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'canteen_id' })
  canteen: Canteen;

  @Column({ name: 'canteen_id' })
  canteenId: string;

  @Column({ name: 'code_value', unique: true })
  codeValue: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
