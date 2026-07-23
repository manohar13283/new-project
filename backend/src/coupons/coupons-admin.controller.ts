import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/role.enum';
import { CouponsService } from './coupons.service';
import { MonthlyCouponAllocation } from '../entities/monthly-coupon-allocation.entity';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../admin/audit.service';

class RegenerateDto {
  year: number;
  month: number;
}

class AdjustBalanceDto {
  workerId: string;
  year: number;
  month: number;
  breakfastTeaDelta?: number;
  mealDelta?: number;
  teaDelta?: number;
  reason: string;
}

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
export class CouponsAdminController {
  constructor(
    private readonly couponsService: CouponsService,
    @InjectRepository(MonthlyCouponAllocation) private readonly allocations: Repository<MonthlyCouponAllocation>,
    private readonly audit: AuditService,
  ) {}

  @Get('allocations')
  findAllocations(@Query('year') year: string, @Query('month') month: string) {
    return this.allocations.find({
      where: { year: parseInt(year, 10), month: parseInt(month, 10) },
      relations: { worker: true },
    });
  }

  @Post('regenerate')
  regenerate(@Body() dto: RegenerateDto) {
    return this.couponsService.generateMonthlyAllocations(dto.year, dto.month);
  }

  @Post('adjust')
  async adjust(@Body() dto: AdjustBalanceDto, @CurrentUser() user: AuthenticatedUser) {
    const allocation = await this.allocations.findOneOrFail({
      where: { workerId: dto.workerId, year: dto.year, month: dto.month },
    });
    const before = { ...allocation };

    if (dto.breakfastTeaDelta) allocation.breakfastTeaTotal += dto.breakfastTeaDelta;
    if (dto.mealDelta) allocation.mealTotal += dto.mealDelta;
    if (dto.teaDelta) allocation.teaTotal += dto.teaDelta;

    const saved = await this.allocations.save(allocation);

    await this.audit.log(user.id, 'ADJUST_COUPON_BALANCE', 'monthly_coupon_allocation', allocation.id, before, saved, dto.reason);
    return saved;
  }
}
