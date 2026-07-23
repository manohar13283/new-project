import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/role.enum';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('admin/notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  broadcast(@Body() dto: { title: string; body: string; departmentId?: string; shiftId?: string }) {
    return this.notificationsService.broadcast(dto.title, dto.body, { departmentId: dto.departmentId, shiftId: dto.shiftId });
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findForWorker(user.id);
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }
}
