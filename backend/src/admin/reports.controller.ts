import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/role.enum';
import { ReportsService } from './reports.service';

type Format = 'json' | 'excel' | 'pdf';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  async daily(@Query('date') date: string, @Query('format') format: Format = 'json', @Res({ passthrough: true }) res: Response) {
    const rows = await this.reportsService.dailyReport(date);
    const mapped = rows.map((t) => ({
      clockNumber: t.worker.clockNumber,
      fullName: t.worker.fullName,
      department: t.worker.department?.name,
      shift: t.shift.code,
      couponType: t.couponType,
      time: t.scannedAt.toISOString(),
    }));
    return this.respond(res, format, `daily-report-${date}`, mapped, [
      { header: 'Clock #', key: 'clockNumber' },
      { header: 'Name', key: 'fullName' },
      { header: 'Department', key: 'department' },
      { header: 'Shift', key: 'shift' },
      { header: 'Coupon Type', key: 'couponType' },
      { header: 'Time', key: 'time', width: 28 },
    ]);
  }

  @Get('monthly')
  async monthly(@Query('from') from: string, @Query('to') to: string, @Query('format') format: Format = 'json', @Res({ passthrough: true }) res: Response) {
    const rows = await this.reportsService.monthlyReport(from, to);
    const mapped = rows.map((t) => ({
      businessDate: t.businessDate,
      clockNumber: t.worker.clockNumber,
      fullName: t.worker.fullName,
      department: t.worker.department?.name,
      couponType: t.couponType,
    }));
    return this.respond(res, format, `monthly-report-${from}_to_${to}`, mapped, [
      { header: 'Date', key: 'businessDate' },
      { header: 'Clock #', key: 'clockNumber' },
      { header: 'Name', key: 'fullName' },
      { header: 'Department', key: 'department' },
      { header: 'Coupon Type', key: 'couponType' },
    ]);
  }

  @Get('department')
  department(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.departmentReport(from, to);
  }

  @Get('shift')
  shift(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.shiftReport(from, to);
  }

  @Get('utilization')
  async utilization(@Query('year') year: string, @Query('month') month: string, @Query('format') format: Format = 'json', @Res({ passthrough: true }) res: Response) {
    const rows = await this.reportsService.utilizationReport(parseInt(year, 10), parseInt(month, 10));
    return this.respond(res, format, `utilization-${year}-${month}`, rows, [
      { header: 'Clock #', key: 'clockNumber' },
      { header: 'Name', key: 'fullName' },
      { header: 'B+Tea Allocated', key: 'breakfastTeaAllocated' },
      { header: 'B+Tea Used', key: 'breakfastTeaUsed' },
      { header: 'Meal Allocated', key: 'mealAllocated' },
      { header: 'Meal Used', key: 'mealUsed' },
      { header: 'Tea Allocated', key: 'teaAllocated' },
      { header: 'Tea Used', key: 'teaUsed' },
      { header: 'Total Allocated', key: 'totalAllocated' },
      { header: 'Total Used', key: 'totalUsed' },
    ]);
  }

  @Get('financial-savings')
  financialSavings(@Query('year') year: string, @Query('month') month: string, @Query('ratePerMeal') ratePerMeal: string) {
    return this.reportsService.financialSavingsReport(parseInt(year, 10), parseInt(month, 10), parseFloat(ratePerMeal ?? '35'));
  }

  private async respond(
    res: Response,
    format: Format,
    filename: string,
    rows: Record<string, unknown>[],
    columns: { header: string; key: string; width?: number }[],
  ) {
    if (format === 'excel') {
      const buffer = await this.reportsService.toExcelBuffer(filename, columns, rows);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      });
      return buffer;
    }
    if (format === 'pdf') {
      const buffer = await this.reportsService.toPdfBuffer(filename, columns, rows);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}.pdf"` });
      return buffer;
    }
    return rows;
  }
}
