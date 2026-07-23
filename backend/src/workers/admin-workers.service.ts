import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Worker } from '../entities/worker.entity';

export interface CreateWorkerInput {
  clockNumber: string;
  fullName: string;
  password: string;
  departmentId: string;
  shiftId: string;
  factoryId: string;
  phone?: string;
  languagePref?: 'en' | 'mr';
}

@Injectable()
export class AdminWorkersService {
  constructor(@InjectRepository(Worker) private readonly workers: Repository<Worker>) {}

  findAll(filters: { department?: string; shift?: string; search?: string }) {
    const qb = this.workers.createQueryBuilder('w').leftJoinAndSelect('w.department', 'department').leftJoinAndSelect('w.shift', 'shift');
    if (filters.department) qb.andWhere('department.id = :department', { department: filters.department });
    if (filters.shift) qb.andWhere('shift.id = :shift', { shift: filters.shift });
    if (filters.search) qb.andWhere('(w.fullName ILIKE :s OR w.clockNumber ILIKE :s)', { s: `%${filters.search}%` });
    return qb.orderBy('w.fullName', 'ASC').getMany();
  }

  async findOneOrFail(id: string) {
    const worker = await this.workers.findOne({ where: { id }, relations: { department: true, shift: true } });
    if (!worker) throw new NotFoundException('Worker not found');
    return worker;
  }

  async create(input: CreateWorkerInput) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const worker = this.workers.create({ ...input, passwordHash, languagePref: input.languagePref ?? 'en' });
    return this.workers.save(worker);
  }

  async bulkImport(rows: CreateWorkerInput[]) {
    const created = [];
    for (const row of rows) {
      created.push(await this.create(row));
    }
    return { imported: created.length };
  }

  async update(id: string, patch: Partial<Omit<CreateWorkerInput, 'password'>> & { isActive?: boolean }) {
    const worker = await this.findOneOrFail(id);
    Object.assign(worker, patch);
    return this.workers.save(worker);
  }

  async deactivate(id: string) {
    const worker = await this.findOneOrFail(id);
    worker.isActive = false;
    return this.workers.save(worker);
  }

  async resetPassword(id: string, newPassword: string) {
    const worker = await this.findOneOrFail(id);
    worker.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.workers.save(worker);
    return { success: true };
  }
}
