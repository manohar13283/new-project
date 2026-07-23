import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Factory } from './factory.entity';

@Entity('holiday')
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Factory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'factory_id' })
  factory: Factory;

  @Column({ name: 'factory_id' })
  factoryId: string;

  @Column({ type: 'date', name: 'holiday_date' })
  holidayDate: string;

  @Column()
  reason: string;
}
