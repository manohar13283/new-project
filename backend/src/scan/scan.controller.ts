import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ScanService } from './scan.service';
import { RedeemDto } from './dto/redeem.dto';

@Controller('scan')
@UseGuards(JwtAuthGuard)
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post('redeem')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  redeem(@Body() dto: RedeemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.scanService.redeem(user.id, dto.qrCodeValue, dto.couponType, dto.deviceId);
  }
}
