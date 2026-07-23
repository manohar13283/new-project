import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CouponType } from '../../common/enums/coupon-type.enum';

export class RedeemDto {
  @IsString()
  @IsNotEmpty()
  qrCodeValue: string;

  @IsEnum(CouponType)
  couponType: CouponType;

  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
