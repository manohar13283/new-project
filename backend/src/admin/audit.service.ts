import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>) {}

  async log(
    adminUserId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    before: unknown,
    after: unknown,
    reason?: string,
  ) {
    return this.logs.save(
      this.logs.create({
        adminUserId,
        action,
        entityType,
        entityId: entityId ?? undefined,
        before: (before as Record<string, unknown>) ?? null,
        after: reason ? { ...(after as Record<string, unknown>), _reason: reason } : ((after as Record<string, unknown>) ?? null),
      }),
    );
  }

  findAll(limit = 200) {
    return this.logs.find({ order: { createdAt: 'DESC' }, take: limit, relations: { adminUser: true } });
  }
}
