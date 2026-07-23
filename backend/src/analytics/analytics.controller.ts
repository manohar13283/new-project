import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/role.enum';
import { AnalyticsService } from './analytics.service';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  kpis(@Query('from') from?: string, @Query('to') to?: string) {
    const today = new Date().toISOString().substring(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10);
    return this.analyticsService.kpis(from ?? monthAgo, to ?? today);
  }
}
