import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AdminLoginDto, OtpRequestDto, OtpVerifyDto, RefreshTokenDto, WorkerLoginDto } from './dto/worker-login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('worker/login')
  @HttpCode(HttpStatus.OK)
  workerLogin(@Body() dto: WorkerLoginDto) {
    return this.authService.workerLoginWithPassword(dto.clockNumber, dto.password);
  }

  @Post('worker/otp/request')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() dto: OtpRequestDto) {
    return this.authService.requestWorkerOtp(dto.clockNumber);
  }

  @Post('worker/otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.authService.verifyWorkerOtp(dto.clockNumber, dto.otp);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.id, user.deviceId!);
  }
}
