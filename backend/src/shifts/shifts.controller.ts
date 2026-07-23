import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/role.enum';
import { ShiftsService } from './shifts.service';
import { CouponType } from '../common/enums/coupon-type.enum';

class SetMealWindowsDto {
  windows: Array<{ couponType: CouponType; startTime: string; endTime: string; crossesMidnight?: boolean }>;
}

@Controller('admin/shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findAll() {
    return this.shiftsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOneOrFail(id);
  }

  @Put(':id/meal-windows')
  setMealWindows(@Param('id') id: string, @Body() dto: SetMealWindowsDto) {
    return this.shiftsService.setMealWindows(id, dto.windows);
  }
}
