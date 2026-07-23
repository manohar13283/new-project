import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from '../entities/worker.entity';
import { Shift } from '../entities/shift.entity';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { CouponType, TransactionStatus } from '../common/enums/coupon-type.enum';
import { findOpenWindow, findWindowForType, formatWindow, toHHMM } from '../shifts/shift-window.util';

const ALL_TYPES = [CouponType.BREAKFAST_TEA, CouponType.MEAL, CouponType.TEA];

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(Worker) private readonly workers: Repository<Worker>,
    @InjectRepository(Shift) private readonly shifts: Repository<Shift>,
    @InjectRepository(MonthlyCouponAllocation) private readonly allocations: Repository<MonthlyCouponAllocation>,
    @InjectRepository(CouponTransaction) private readonly transactions: Repository<CouponTransaction>,
  ) {}

  async getProfile(workerId: string) {
    const worker = await this.workers.findOne({ where: { id: workerId }, relations: { department: true, shift: true } });
    if (!worker) throw new NotFoundException('Worker not found');
    return {
      id: worker.id,
      clockNumber: worker.clockNumber,
      fullName: worker.fullName,
      department: worker.department.name,
      shift: worker.shift.code,
      photoUrl: worker.photoUrl,
      languagePref: worker.languagePref,
    };
  }

  async getTodayCoupons(workerId: string) {
    const worker = await this.workers.findOneOrFail({ where: { id: workerId } });
    const shift = await this.shifts.findOne({ where: { id: worker.shiftId }, relations: { mealWindows: true } });
    if (!shift) throw new NotFoundException('Worker has no assigned shift');

    const now = new Date();
    const nowHHMM = toHHMM(now);
    const today = now.toISOString().substring(0, 10);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const allocation = await this.allocations.findOne({ where: { workerId, year, month } });
    const usedTodayRows = await this.transactions.find({
      where: { workerId, businessDate: today, status: TransactionStatus.SUCCESS },
    });
    const usedTodayTypes = new Set(usedTodayRows.map((t) => t.couponType));

    const balanceField: Record<CouponType, { used: keyof MonthlyCouponAllocation; total: keyof MonthlyCouponAllocation }> = {
      [CouponType.BREAKFAST_TEA]: { used: 'breakfastTeaUsed', total: 'breakfastTeaTotal' },
      [CouponType.MEAL]: { used: 'mealUsed', total: 'mealTotal' },
      [CouponType.TEA]: { used: 'teaUsed', total: 'teaTotal' },
    };

    const coupons = ALL_TYPES.map((type) => {
      const window = findWindowForType(shift.mealWindows, type);
      const isOpenNow = !!findOpenWindow(shift.mealWindows, type, nowHHMM);
      const { used, total } = balanceField[type];
      const remaining = allocation ? (allocation[total] as number) - (allocation[used] as number) : 0;
      return {
        type,
        window: window ? formatWindow(window) : null,
        isOpenNow,
        remaining,
        usedToday: usedTodayTypes.has(type),
      };
    });

    return { businessDate: today, shift: shift.code, coupons };
  }

  async getMonthlyBalance(workerId: string, year: number, month: number) {
    const allocation = await this.allocations.findOne({ where: { workerId, year, month } });
    if (!allocation) throw new NotFoundException('No allocation for this period');
    return allocation;
  }

  async getTransactions(workerId: string, from?: string, to?: string, type?: CouponType) {
    const qb = this.transactions
      .createQueryBuilder('t')
      .where('t.workerId = :workerId', { workerId })
      .orderBy('t.scannedAt', 'DESC');
    if (from) qb.andWhere('t.businessDate >= :from', { from });
    if (to) qb.andWhere('t.businessDate <= :to', { to });
    if (type) qb.andWhere('t.couponType = :type', { type });
    return qb.getMany();
  }
}
