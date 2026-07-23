import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';
import { TransactionStatus } from '../common/enums/coupon-type.enum';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(CouponTransaction) private readonly transactions: Repository<CouponTransaction>,
    @InjectRepository(MonthlyCouponAllocation) private readonly allocations: Repository<MonthlyCouponAllocation>,
  ) {}

  async kpis(from: string, to: string) {
    const base = () =>
      this.transactions
        .createQueryBuilder('t')
        .where('t.status = :status', { status: TransactionStatus.SUCCESS })
        .andWhere('t.businessDate BETWEEN :from AND :to', { from, to });

    const byType = await base().select('t.couponType', 'type').addSelect('COUNT(*)', 'count').groupBy('t.couponType').getRawMany();

    const byDepartment = await base()
      .leftJoin('t.worker', 'worker')
      .leftJoin('worker.department', 'department')
      .select('department.name', 'department')
      .addSelect('COUNT(*)', 'count')
      .groupBy('department.name')
      .getRawMany();

    const byShift = await base()
      .leftJoin('t.shift', 'shift')
      .select('shift.code', 'shift')
      .addSelect('COUNT(*)', 'count')
      .groupBy('shift.code')
      .getRawMany();

    const peakTime = await base()
      .select("DATE_TRUNC('hour', t.scannedAt)", 'hour')
      .addSelect('COUNT(*)', 'count')
      .groupBy('hour')
      .orderBy('count', 'DESC')
      .limit(1)
      .getRawOne();

    const dailyTrend = await base()
      .select('t.businessDate', 'date')
      .addSelect('t.couponType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('t.businessDate')
      .addGroupBy('t.couponType')
      .orderBy('t.businessDate', 'ASC')
      .getRawMany();

    const [year, month] = [parseInt(to.substring(0, 4), 10), parseInt(to.substring(5, 7), 10)];
    const allocations = await this.allocations.find({ where: { year, month } });
    const totalAllocated = allocations.reduce((sum, a) => sum + a.breakfastTeaTotal + a.mealTotal + a.teaTotal, 0);
    const totalUsed = allocations.reduce((sum, a) => sum + a.breakfastTeaUsed + a.mealUsed + a.teaUsed, 0);
    const unusedCoupons = totalAllocated - totalUsed;
    const workerUsagePercent = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 10000) / 100 : 0;

    return {
      range: { from, to },
      byType,
      byDepartment,
      byShift,
      peakTime: peakTime?.hour ?? null,
      dailyTrend,
      unusedCoupons,
      workerUsagePercent,
      activeWorkers: allocations.length,
    };
  }
}
