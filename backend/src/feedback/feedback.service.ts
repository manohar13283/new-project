import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../entities/feedback.entity';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback) private readonly feedbacks: Repository<Feedback>,
    @InjectRepository(CouponTransaction) private readonly transactions: Repository<CouponTransaction>,
  ) {}

  async create(workerId: string, dto: CreateFeedbackDto) {
    const transaction = await this.transactions.findOne({ where: { id: dto.transactionId } });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.workerId !== workerId) throw new ForbiddenException('Cannot submit feedback for another worker\'s transaction');

    const existing = await this.feedbacks.findOne({ where: { transactionId: dto.transactionId } });
    if (existing) throw new ConflictException('Feedback already submitted for this transaction');

    const feedback = this.feedbacks.create({
      transactionId: dto.transactionId,
      workerId,
      rating: dto.rating,
      comment: dto.comment,
      categories: dto.categories ?? [],
      photoUrl: dto.photoUrl,
    });
    return this.feedbacks.save(feedback);
  }

  async analytics(from?: string, to?: string) {
    const qb = this.feedbacks.createQueryBuilder('f');
    if (from) qb.andWhere('f.createdAt >= :from', { from });
    if (to) qb.andWhere('f.createdAt <= :to', { to });

    const avgRating = await qb.clone().select('AVG(f.rating)', 'avg').getRawOne();
    const byCategory = await qb
      .clone()
      .select('unnest(f.categories)', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('category')
      .orderBy('count', 'DESC')
      .getRawMany();
    const trend = await qb
      .clone()
      .select("DATE_TRUNC('day', f.createdAt)", 'day')
      .addSelect('AVG(f.rating)', 'avgRating')
      .addSelect('COUNT(*)', 'count')
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    return {
      averageRating: parseFloat(avgRating?.avg ?? '0'),
      mostCommonCategories: byCategory,
      dailyTrend: trend,
    };
  }
}
