import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Factory } from './factory.entity';

@Entity('canteen')
export class Canteen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Factory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'factory_id' })
  factory: Factory;

  @Column({ name: 'factory_id' })
  factoryId: string;

  @Column()
  name: string;

  @Column()
  location: string;
}
