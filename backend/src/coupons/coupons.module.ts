import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Worker } from '../entities/worker.entity';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';
import { CouponsService } from './coupons.service';
import { CouponsAdminController } from './coupons-admin.controller';
import { AuditModule } from '../admin/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Worker, MonthlyCouponAllocation]), AuditModule],
  providers: [CouponsService],
  controllers: [CouponsAdminController],
  exports: [CouponsService],
})
export class CouponsModule {}
