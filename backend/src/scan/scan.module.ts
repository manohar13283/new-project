import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Worker } from '../entities/worker.entity';
import { QrCode } from '../entities/qr-code.entity';
import { Shift } from '../entities/shift.entity';
import { Holiday } from '../entities/holiday.entity';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Worker, QrCode, Shift, Holiday, MonthlyCouponAllocation, CouponTransaction]),
    DashboardModule,
  ],
  providers: [ScanService],
  controllers: [ScanController],
})
export class ScanModule {}
