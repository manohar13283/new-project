import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { WorkersService } from './workers.service';
import { CouponType } from '../common/enums/coupon-type.enum';

@Controller()
@UseGuards(JwtAuthGuard)
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.workersService.getProfile(user.id);
  }

  @Get('me/coupons/today')
  getTodayCoupons(@CurrentUser() user: AuthenticatedUser) {
    return this.workersService.getTodayCoupons(user.id);
  }

  @Get('me/coupons/balance')
  getMonthlyBalance(@CurrentUser() user: AuthenticatedUser, @Query('year') year: string, @Query('month') month: string) {
    return this.workersService.getMonthlyBalance(user.id, parseInt(year, 10), parseInt(month, 10));
  }

  @Get('me/transactions')
  getTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: CouponType,
  ) {
    return this.workersService.getTransactions(user.id, from, to, type);
  }
}
