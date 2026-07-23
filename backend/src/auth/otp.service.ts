import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Provider-agnostic OTP service. Swap sendSms() for a real gateway
 * (MSG91, Twilio, etc.) at go-live; interface stays the same.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly redis: Redis;
  private readonly ttlSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis(this.config.get<string>('redisUrl')!);
    this.ttlSeconds = this.config.get<number>('otp.ttlSeconds')!;
  }

  private key(clockNumber: string) {
    return `otp:${clockNumber}`;
  }

  async requestOtp(clockNumber: string, phone: string | null): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(this.key(clockNumber), otp, 'EX', this.ttlSeconds);
    await this.sendSms(phone, otp);
  }

  async verifyOtp(clockNumber: string, otp: string): Promise<boolean> {
    const stored = await this.redis.get(this.key(clockNumber));
    if (!stored || stored !== otp) return false;
    await this.redis.del(this.key(clockNumber));
    return true;
  }

  private async sendSms(phone: string | null, otp: string): Promise<void> {
    if (!phone) {
      this.logger.warn('Worker has no phone number on file; OTP not delivered');
      return;
    }
    // TODO: integrate real SMS provider using config.get('otp.providerApiKey')
    this.logger.log(`[DEV] OTP for ${phone}: ${otp}`);
  }
}
