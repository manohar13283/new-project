import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from '../entities/menu-item.entity';

@Injectable()
export class MenuService {
  constructor(@InjectRepository(MenuItem) private readonly menuItems: Repository<MenuItem>) {}

  findByDate(date: string) {
    return this.menuItems.find({ where: { servedDate: date }, relations: { shift: true } });
  }

  create(input: Partial<MenuItem>) {
    return this.menuItems.save(this.menuItems.create(input));
  }
}
