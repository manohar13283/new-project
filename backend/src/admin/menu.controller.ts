import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/role.enum';
import { MenuService } from './menu.service';
import { MenuItem } from '../entities/menu-item.entity';

@Controller('admin/menu')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  findByDate(@Query('date') date: string) {
    return this.menuService.findByDate(date);
  }

  @Post()
  create(@Body() dto: Partial<MenuItem>) {
    return this.menuService.create(dto);
  }
}
