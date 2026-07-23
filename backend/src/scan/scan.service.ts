import { BadRequestException, ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Worker } from '../entities/worker.entity';
import { QrCode } from '../entities/qr-code.entity';
import { Shift } from '../entities/shift.entity';
import { Holiday } from '../entities/holiday.entity';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { CouponType, RejectReason, TransactionStatus } from '../common/enums/coupon-type.enum';
import { findOpenWindow, findWindowForType, formatWindow, resolveBusinessDate, toHHMM } from '../shifts/shift-window.util';
import { DashboardGateway } from '../dashboard/dashboard.gateway';

const BALANCE_FIELD: Record<CouponType, { used: keyof MonthlyCouponAllocation; total: keyof MonthlyCouponAllocation }> = {
  [CouponType.BREAKFAST_TEA]: { used: 'breakfastTeaUsed', total: 'breakfastTeaTotal' },
  [CouponType.MEAL]: { used: 'mealUsed', total: 'mealTotal' },
  [CouponType.TEA]: { used: 'teaUsed', total: 'teaTotal' },
};

export interface RedeemResult {
  transactionId: string;
  status: TransactionStatus;
  couponType: CouponType;
  scannedAt: Date;
  remainingAfter?: number;
  reason?: RejectReason;
  message?: string;
}

@Injectable()
export class ScanService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Worker) private readonly workers: Repository<Worker>,
    @InjectRepository(QrCode) private readonly qrCodes: Repository<QrCode>,
    @InjectRepository(Shift) private readonly shifts: Repository<Shift>,
    @InjectRepository(Holiday) private readonly holidays: Repository<Holiday>,
    private readonly dashboardGateway: DashboardGateway,
  ) {}

  async redeem(workerId: string, qrCodeValue: string, couponType: CouponType, deviceId: string): Promise<RedeemResult> {
    const worker = await this.workers.findOne({ where: { id: workerId }, relations: { department: true } });
    if (!worker || !worker.isActive) throw new NotFoundException('Worker not found or inactive');

    const qrCode = await this.qrCodes.findOne({ where: { codeValue: qrCodeValue, active: true }, relations: { canteen: true } });
    if (!qrCode) throw new BadRequestException({ reason: RejectReason.INVALID_QR_CODE, message: 'QR code is invalid or inactive' });

    const shift = await this.shifts.findOne({ where: { id: worker.shiftId }, relations: { mealWindows: true } });
    if (!shift) throw new BadRequestException('Worker has no assigned shift');

    const now = new Date();
    const nowHHMM = toHHMM(now);
    const openWindow = findOpenWindow(shift.mealWindows, couponType, nowHHMM);

    if (!openWindow) {
      const anyWindow = findWindowForType(shift.mealWindows, couponType);
      const message = anyWindow
        ? `${this.couponLabel(couponType)} is only available ${formatWindow(anyWindow)}`
        : `${this.couponLabel(couponType)} is not offered for your shift`;
      throw new UnprocessableEntityException({ status: TransactionStatus.REJECTED, reason: RejectReason.OUTSIDE_SHIFT_WINDOW, message });
    }

    const businessDate = resolveBusinessDate(now, openWindow);

    const holiday = await this.holidays.findOne({ where: { factoryId: worker.factoryId, holidayDate: businessDate } });
    if (holiday) {
      throw new UnprocessableEntityException({ status: TransactionStatus.REJECTED, reason: RejectReason.HOLIDAY, message: `Canteen closed today: ${holiday.reason}` });
    }

    return this.runRedemptionTransaction(worker, shift, qrCode, openWindow.id, couponType, businessDate, deviceId, now);
  }

  private async runRedemptionTransaction(
    worker: Worker,
    shift: Shift,
    qrCode: QrCode,
    shiftMealWindowId: string,
    couponType: CouponType,
    businessDate: string,
    deviceId: string,
    now: Date,
  ): Promise<RedeemResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const year = parseInt(businessDate.substring(0, 4), 10);
      const month = parseInt(businessDate.substring(5, 7), 10);

      // Row lock prevents a race between two concurrent redemption attempts from double-spending the same balance.
      const allocation = await queryRunner.manager
        .createQueryBuilder(MonthlyCouponAllocation, 'a')
        .setLock('pessimistic_write')
        .where('a.workerId = :workerId AND a.year = :year AND a.month = :month', { workerId: worker.id, year, month })
        .getOne();

      if (!allocation) {
        await queryRunner.rollbackTransaction();
        throw new UnprocessableEntityException({
          status: TransactionStatus.REJECTED,
          reason: RejectReason.BALANCE_EXHAUSTED,
          message: 'No coupon allocation found for this month',
        });
      }

      const { used, total } = BALANCE_FIELD[couponType];
      if ((allocation[used] as number) >= (allocation[total] as number)) {
        await queryRunner.rollbackTransaction();
        throw new UnprocessableEntityException({ status: TransactionStatus.REJECTED, reason: RejectReason.BALANCE_EXHAUSTED, message: 'Monthly balance exhausted for this coupon type' });
      }

      const transaction = queryRunner.manager.create(CouponTransaction, {
        workerId: worker.id,
        shiftId: shift.id,
        shiftMealWindowId,
        canteenId: qrCode.canteenId,
        qrCodeId: qrCode.id,
        couponType,
        businessDate,
        status: TransactionStatus.SUCCESS,
        deviceId,
      });

      try {
        await queryRunner.manager.save(transaction);
      } catch (err: any) {
        await queryRunner.rollbackTransaction();
        if (err.code === '23505') {
          const existing = await this.dataSource.getRepository(CouponTransaction).findOne({
            where: { workerId: worker.id, couponType, businessDate, status: TransactionStatus.SUCCESS },
          });
          throw new ConflictException({
            status: TransactionStatus.REJECTED,
            reason: RejectReason.ALREADY_USED_TODAY,
            message: `Already used today at ${existing?.scannedAt.toLocaleTimeString() ?? ''}`,
            existingTransaction: existing,
          });
        }
        throw err;
      }

      (allocation[used] as number) = (allocation[used] as number) + 1;
      await queryRunner.manager.save(allocation);

      await queryRunner.commitTransaction();

      const remainingAfter = (allocation[total] as number) - (allocation[used] as number);

      this.dashboardGateway.broadcastScan({
        transactionId: transaction.id,
        workerName: worker.fullName,
        clockNumber: worker.clockNumber,
        department: worker.department?.name ?? '',
        shift: shift.code,
        couponType,
        businessDate,
        time: now.toLocaleTimeString(),
        status: TransactionStatus.SUCCESS,
        remaining: {
          breakfastTea: allocation.breakfastTeaTotal - allocation.breakfastTeaUsed,
          meal: allocation.mealTotal - allocation.mealUsed,
          tea: allocation.teaTotal - allocation.teaUsed,
        },
        photoUrl: worker.photoUrl ?? null,
      });

      return {
        transactionId: transaction.id,
        status: TransactionStatus.SUCCESS,
        couponType,
        scannedAt: transaction.scannedAt,
        remainingAfter,
      };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private couponLabel(type: CouponType): string {
    return { BREAKFAST_TEA: 'Breakfast + Tea', MEAL: 'Meal', TEA: 'Tea' }[type];
  }
}
