import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CouponTransaction, MonthlyCouponAllocation])],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
