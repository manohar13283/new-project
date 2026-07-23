import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CouponTransaction } from '../entities/coupon-transaction.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    @InjectRepository(CouponTransaction) private readonly transactions: Repository<CouponTransaction>,
  ) {}

  @Get('scans/today')
  async today(@Query('shift') shift?: string, @Query('department') department?: string) {
    const qb = this.transactions
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.worker', 'worker')
      .leftJoinAndSelect('worker.department', 'department')
      .leftJoinAndSelect('t.shift', 'shiftEntity')
      .where('t.businessDate = CURRENT_DATE')
      .orderBy('t.scannedAt', 'DESC')
      .limit(200);

    if (shift) qb.andWhere('shiftEntity.code = :shift', { shift });
    if (department) qb.andWhere('department.name = :department', { department });

    return qb.getMany();
  }
}
