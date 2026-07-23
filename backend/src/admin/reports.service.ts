import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { CouponTransaction } from '../entities/coupon-transaction.entity';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';
import { TransactionStatus } from '../common/enums/coupon-type.enum';

export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(CouponTransaction) private readonly transactions: Repository<CouponTransaction>,
    @InjectRepository(MonthlyCouponAllocation) private readonly allocations: Repository<MonthlyCouponAllocation>,
  ) {}

  async dailyReport(date: string) {
    return this.transactions.find({
      where: { businessDate: date, status: TransactionStatus.SUCCESS },
      relations: { worker: { department: true }, shift: true },
      order: { scannedAt: 'ASC' },
    });
  }

  async monthlyReport(from: string, to: string) {
    return this.transactions
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.worker', 'worker')
      .leftJoinAndSelect('worker.department', 'department')
      .where('t.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('t.businessDate BETWEEN :from AND :to', { from, to })
      .orderBy('t.businessDate', 'ASC')
      .getMany();
  }

  async departmentReport(from: string, to: string) {
    return this.transactions
      .createQueryBuilder('t')
      .leftJoin('t.worker', 'worker')
      .leftJoin('worker.department', 'department')
      .select('department.name', 'department')
      .addSelect('t.couponType', 'couponType')
      .addSelect('COUNT(*)', 'count')
      .where('t.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('t.businessDate BETWEEN :from AND :to', { from, to })
      .groupBy('department.name')
      .addGroupBy('t.couponType')
      .getRawMany();
  }

  async shiftReport(from: string, to: string) {
    return this.transactions
      .createQueryBuilder('t')
      .leftJoin('t.shift', 'shift')
      .select('shift.code', 'shift')
      .addSelect('t.couponType', 'couponType')
      .addSelect('COUNT(*)', 'count')
      .where('t.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('t.businessDate BETWEEN :from AND :to', { from, to })
      .groupBy('shift.code')
      .addGroupBy('t.couponType')
      .getRawMany();
  }

  async utilizationReport(year: number, month: number) {
    const allocations = await this.allocations.find({ where: { year, month }, relations: { worker: true } });
    return allocations.map((a) => ({
      clockNumber: a.worker.clockNumber,
      fullName: a.worker.fullName,
      breakfastTeaAllocated: a.breakfastTeaTotal,
      breakfastTeaUsed: a.breakfastTeaUsed,
      mealAllocated: a.mealTotal,
      mealUsed: a.mealUsed,
      teaAllocated: a.teaTotal,
      teaUsed: a.teaUsed,
      totalAllocated: a.breakfastTeaTotal + a.mealTotal + a.teaTotal,
      totalUsed: a.breakfastTeaUsed + a.mealUsed + a.teaUsed,
    }));
  }

  /** Compares attendance-based cost (rate x active workers x working days) to actual-consumption cost. */
  async financialSavingsReport(year: number, month: number, ratePerMeal: number, workingDays = 26) {
    const allocations = await this.allocations.find({ where: { year, month } });
    const activeWorkerCount = allocations.length;
    const attendanceBasedCost = activeWorkerCount * workingDays * 3 * ratePerMeal; // 3 = breakfast+meal+tea slots/day
    const totalConsumed = allocations.reduce((sum, a) => sum + a.breakfastTeaUsed + a.mealUsed + a.teaUsed, 0);
    const actualCost = totalConsumed * ratePerMeal;
    return {
      year,
      month,
      activeWorkerCount,
      attendanceBasedCost,
      actualConsumptionCost: actualCost,
      savings: attendanceBasedCost - actualCost,
      savingsPercent: attendanceBasedCost > 0 ? Math.round(((attendanceBasedCost - actualCost) / attendanceBasedCost) * 10000) / 100 : 0,
    };
  }

  async toExcelBuffer(sheetName: string, columns: ReportColumn[], rows: Record<string, unknown>[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 20 }));
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));
    return workbook.xlsx.writeBuffer() as unknown as Buffer;
  }

  async toPdfBuffer(title: string, columns: ReportColumn[], rows: Record<string, unknown>[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(title, { align: 'center' }).moveDown();
      doc.fontSize(9);
      const colWidth = (doc.page.width - 60) / columns.length;

      const drawRow = (values: string[], bold = false) => {
        const y = doc.y;
        values.forEach((v, i) => {
          doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').text(v ?? '', 30 + i * colWidth, y, { width: colWidth });
        });
        doc.moveDown();
      };

      drawRow(columns.map((c) => c.header), true);
      rows.forEach((row) => drawRow(columns.map((c) => String(row[c.key] ?? ''))));

      doc.end();
    });
  }
}
