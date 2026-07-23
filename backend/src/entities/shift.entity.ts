import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ShiftCode } from '../common/enums/coupon-type.enum';
import { ShiftMealWindow } from './shift-meal-window.entity';

@Entity('shift')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ShiftCode, unique: true })
  code: ShiftCode;

  @Column()
  name: string;

  @OneToMany(() => ShiftMealWindow, (window) => window.shift, { cascade: true })
  mealWindows: ShiftMealWindow[];
}
