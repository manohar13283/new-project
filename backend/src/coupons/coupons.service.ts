import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Worker } from '../entities/worker.entity';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @InjectRepository(Worker) private readonly workers: Repository<Worker>,
    @InjectRepository(MonthlyCouponAllocation) private readonly allocations: Repository<MonthlyCouponAllocation>,
    private readonly config: ConfigService,
  ) {}

  /** Runs at 00:05 on the 1st of every month (server local time). */
  @Cron('0 5 0 1 * *')
  async handleMonthlyAllocationCron() {
    const now = new Date();
    const result = await this.generateMonthlyAllocations(now.getFullYear(), now.getMonth() + 1);
    this.logger.log(`Monthly coupon allocation: created ${result.created}, already existed ${result.skipped}`);
  }

  /** Idempotent: safe to re-run for the same year/month (e.g. via admin "Regenerate" action). */
  async generateMonthlyAllocations(year: number, month: number): Promise<{ created: number; skipped: number }> {
    const totals = {
      breakfastTeaTotal: this.config.get<number>('coupons.breakfastTea')!,
      mealTotal: this.config.get<number>('coupons.meal')!,
      teaTotal: this.config.get<number>('coupons.tea')!,
    };

    const activeWorkers = await this.workers.find({ where: { isActive: true } });
    const existing = await this.allocations.find({ where: { year, month } });
    const existingWorkerIds = new Set(existing.map((a) => a.workerId));

    const toCreate = activeWorkers
      .filter((w) => !existingWorkerIds.has(w.id))
      .map((w) =>
        this.allocations.create({
          workerId: w.id,
          year,
          month,
          ...totals,
          breakfastTeaUsed: 0,
          mealUsed: 0,
          teaUsed: 0,
          generatedAt: new Date(),
        }),
      );

    if (toCreate.length > 0) {
      await this.allocations.save(toCreate);
    }

    return { created: toCreate.length, skipped: existingWorkerIds.size };
  }

  async getBalance(workerId: string, year: number, month: number): Promise<MonthlyCouponAllocation | null> {
    return this.allocations.findOne({ where: { workerId, year, month } });
  }
}
