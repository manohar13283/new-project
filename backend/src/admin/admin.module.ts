import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from '../entities/menu-item.entity';
import { Holiday } from '../entities/holiday.entity';
import { Notification } from '../entities/notification.entity';
import { NotificationRecipient } from '../entities/notification-recipient.entity';
import { Worker } from '../entities/worker.entity';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { HolidaysService } from './holidays.service';
import { HolidaysController } from './holidays.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AuditModule } from './audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem, Holiday, Notification, NotificationRecipient, Worker, CouponTransaction, MonthlyCouponAllocation]),
    AuditModule,
  ],
  providers: [MenuService, HolidaysService, NotificationsService, ReportsService],
  controllers: [MenuController, HolidaysController, NotificationsController, ReportsController],
})
export class AdminModule {}
