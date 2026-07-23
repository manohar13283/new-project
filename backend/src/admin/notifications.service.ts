import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationRecipient } from '../entities/notification-recipient.entity';
import { Worker } from '../entities/worker.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    @InjectRepository(NotificationRecipient) private readonly recipients: Repository<NotificationRecipient>,
    @InjectRepository(Worker) private readonly workers: Repository<Worker>,
  ) {}

  async broadcast(title: string, body: string, audienceFilter?: { departmentId?: string; shiftId?: string }) {
    const notification = await this.notifications.save(this.notifications.create({ title, body, audienceFilter: audienceFilter ?? null }));

    const qb = this.workers.createQueryBuilder('w').where('w.isActive = true');
    if (audienceFilter?.departmentId) qb.andWhere('w.departmentId = :d', { d: audienceFilter.departmentId });
    if (audienceFilter?.shiftId) qb.andWhere('w.shiftId = :s', { s: audienceFilter.shiftId });
    const targets = await qb.getMany();

    const recipientRows = targets.map((w) =>
      this.recipients.create({ notificationId: notification.id, workerId: w.id, read: false }),
    );
    await this.recipients.save(recipientRows);

    return { notification, recipientCount: recipientRows.length };
  }

  findForWorker(workerId: string) {
    return this.recipients.find({ where: { workerId }, relations: { notification: true }, order: { id: 'DESC' } });
  }

  async markRead(recipientId: string) {
    await this.recipients.update({ id: recipientId }, { read: true });
    return { success: true };
  }
}
