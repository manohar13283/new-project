import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { Worker } from '../entities/worker.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { DeviceSession } from '../entities/device-session.entity';
import { OtpService } from './otp.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Worker) private readonly workers: Repository<Worker>,
    @InjectRepository(AdminUser) private readonly admins: Repository<AdminUser>,
    @InjectRepository(DeviceSession) private readonly sessions: Repository<DeviceSession>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
  ) {}

  async workerLoginWithPassword(clockNumber: string, password: string, deviceId?: string) {
    const worker = await this.workers.findOne({ where: { clockNumber, isActive: true } });
    if (!worker || !(await bcrypt.compare(password, worker.passwordHash))) {
      throw new UnauthorizedException('Invalid clock number or password');
    }
    return this.issueWorkerTokens(worker, deviceId);
  }

  async requestWorkerOtp(clockNumber: string) {
    const worker = await this.workers.findOne({ where: { clockNumber, isActive: true } });
    if (!worker) throw new UnauthorizedException('Unknown clock number');
    await this.otp.requestOtp(clockNumber, worker.phone);
  }

  async verifyWorkerOtp(clockNumber: string, otp: string, deviceId?: string) {
    const worker = await this.workers.findOne({ where: { clockNumber, isActive: true } });
    if (!worker) throw new UnauthorizedException('Unknown clock number');
    const ok = await this.otp.verifyOtp(clockNumber, otp);
    if (!ok) throw new UnauthorizedException('Invalid or expired OTP');
    return this.issueWorkerTokens(worker, deviceId);
  }

  async adminLogin(email: string, password: string) {
    const admin = await this.admins.findOne({ where: { email, isActive: true } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const accessToken = this.jwt.sign(
      { sub: admin.id, type: 'ADMIN', role: admin.role.name },
      { secret: this.config.get('jwt.accessSecret'), expiresIn: this.config.get('jwt.accessTtl') },
    );
    const refreshToken = this.jwt.sign(
      { sub: admin.id, type: 'ADMIN', role: admin.role.name },
      { secret: this.config.get('jwt.refreshSecret'), expiresIn: this.config.get('jwt.refreshTtl') },
    );
    return { accessToken, refreshToken, admin: { id: admin.id, email: admin.email, role: admin.role.name } };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwt.verify(refreshToken, { secret: this.config.get('jwt.refreshSecret') });
      const accessToken = this.jwt.sign(
        { sub: payload.sub, type: payload.type, role: payload.role, deviceId: payload.deviceId },
        { secret: this.config.get('jwt.accessSecret'), expiresIn: this.config.get('jwt.accessTtl') },
      );
      return { accessToken, refreshToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(workerId: string, deviceId: string) {
    await this.sessions.delete({ workerId, deviceId });
  }

  private async issueWorkerTokens(worker: Worker, deviceId = uuid()): Promise<TokenPair & { worker: Partial<Worker> }> {
    const accessToken = this.jwt.sign(
      { sub: worker.id, type: 'WORKER', deviceId },
      { secret: this.config.get('jwt.accessSecret'), expiresIn: this.config.get('jwt.accessTtl') },
    );
    const refreshToken = this.jwt.sign(
      { sub: worker.id, type: 'WORKER', deviceId },
      { secret: this.config.get('jwt.refreshSecret'), expiresIn: this.config.get('jwt.refreshTtl') },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.sessions.upsert(
      {
        workerId: worker.id,
        deviceId,
        refreshTokenHash,
        lastSeenAt: new Date(),
        expiresAt,
      },
      ['workerId', 'deviceId'],
    );

    return {
      accessToken,
      refreshToken,
      worker: {
        id: worker.id,
        clockNumber: worker.clockNumber,
        fullName: worker.fullName,
        photoUrl: worker.photoUrl,
        languagePref: worker.languagePref,
      },
    };
  }
}
