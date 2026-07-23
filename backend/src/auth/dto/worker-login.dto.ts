import { IsNotEmpty, IsString } from 'class-validator';

export class WorkerLoginDto {
  @IsString()
  @IsNotEmpty()
  clockNumber: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class OtpRequestDto {
  @IsString()
  @IsNotEmpty()
  clockNumber: string;
}

export class OtpVerifyDto {
  @IsString()
  @IsNotEmpty()
  clockNumber: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
