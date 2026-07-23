import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/role.enum';
import { HolidaysService } from './holidays.service';
import { Holiday } from '../entities/holiday.entity';

@Controller('admin/holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  findAll(@Query('factoryId') factoryId?: string) {
    return this.holidaysService.findAll(factoryId);
  }

  @Post()
  create(@Body() dto: Partial<Holiday>) {
    return this.holidaysService.create(dto);
  }
}
