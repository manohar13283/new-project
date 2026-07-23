import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/role.enum';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Controller()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('feedback')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateFeedbackDto, @CurrentUser() user: AuthenticatedUser) {
    return this.feedbackService.create(user.id, dto);
  }

  @Get('admin/reports/feedback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.CANTEEN_STAFF)
  analytics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.feedbackService.analytics(from, to);
  }
}
