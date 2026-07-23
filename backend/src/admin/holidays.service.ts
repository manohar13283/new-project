import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from '../entities/holiday.entity';

@Injectable()
export class HolidaysService {
  constructor(@InjectRepository(Holiday) private readonly holidays: Repository<Holiday>) {}

  findAll(factoryId?: string) {
    return this.holidays.find({ where: factoryId ? { factoryId } : {}, order: { holidayDate: 'ASC' } });
  }

  create(input: Partial<Holiday>) {
    return this.holidays.save(this.holidays.create(input));
  }
}
