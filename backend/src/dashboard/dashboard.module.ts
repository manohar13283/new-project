import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CouponTransaction])],
  providers: [DashboardGateway],
  controllers: [DashboardController],
  exports: [DashboardGateway],
})
export class DashboardModule {}
