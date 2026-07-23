import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Department } from './department.entity';
import { Shift } from './shift.entity';
import { Factory } from './factory.entity';

@Entity('worker')
export class Worker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'clock_number' })
  clockNumber: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @ManyToOne(() => Department, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'department_id' })
  departmentId: string;

  @ManyToOne(() => Shift, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ name: 'shift_id' })
  shiftId: string;

  @ManyToOne(() => Factory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'factory_id' })
  factory: Factory;

  @Column({ name: 'factory_id' })
  factoryId: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ name: 'language_pref', default: 'en' })
  languagePref: 'en' | 'mr';

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
