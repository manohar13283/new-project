import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from '../entities/feedback.entity';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, CouponTransaction])],
  providers: [FeedbackService],
  controllers: [FeedbackController],
})
export class FeedbackModule {}
