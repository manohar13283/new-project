import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { ALL_ENTITIES } from './entities/all-entities';
import { AuthModule } from './auth/auth.module';
import { WorkersModule } from './workers/workers.module';
import { ShiftsModule } from './shifts/shifts.module';
import { CouponsModule } from './coupons/coupons.module';
import { ScanModule } from './scan/scan.module';
import { FeedbackModule } from './feedback/feedback.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './admin/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('databaseUrl'),
        entities: ALL_ENTITIES,
        synchronize: false,
        logging: config.get('nodeEnv') === 'development',
      }),
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 60 }] }),
    ScheduleModule.forRoot(),
    AuthModule,
    WorkersModule,
    ShiftsModule,
    CouponsModule,
    ScanModule,
    FeedbackModule,
    DashboardModule,
    AdminModule,
    AuditModule,
    AnalyticsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
