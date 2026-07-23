import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Worker } from '../entities/worker.entity';
import { Shift } from '../entities/shift.entity';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';
import { AdminWorkersService } from './admin-workers.service';
import { AdminWorkersController } from './admin-workers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Worker, Shift, MonthlyCouponAllocation, CouponTransaction])],
  providers: [WorkersService, AdminWorkersService],
  controllers: [WorkersController, AdminWorkersController],
})
export class WorkersModule {}
