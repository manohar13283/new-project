import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from '../entities/shift.entity';
import { ShiftMealWindow } from '../entities/shift-meal-window.entity';
import { CouponType } from '../common/enums/coupon-type.enum';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift) private readonly shifts: Repository<Shift>,
    @InjectRepository(ShiftMealWindow) private readonly windows: Repository<ShiftMealWindow>,
  ) {}

  findAll() {
    return this.shifts.find({ relations: { mealWindows: true } });
  }

  async findOneOrFail(id: string): Promise<Shift> {
    const shift = await this.shifts.findOne({ where: { id }, relations: { mealWindows: true } });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async setMealWindows(
    shiftId: string,
    windows: Array<{ couponType: CouponType; startTime: string; endTime: string; crossesMidnight?: boolean }>,
  ) {
    await this.findOneOrFail(shiftId);
    await this.windows.delete({ shiftId });
    const created = windows.map((w) => this.windows.create({ ...w, shiftId }));
    return this.windows.save(created);
  }
}
