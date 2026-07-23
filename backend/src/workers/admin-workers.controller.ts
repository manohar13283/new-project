import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/role.enum';
import { AdminWorkersService, CreateWorkerInput } from './admin-workers.service';

@Controller('admin/workers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
export class AdminWorkersController {
  constructor(private readonly service: AdminWorkersService) {}

  @Get()
  findAll(@Query('department') department?: string, @Query('shift') shift?: string, @Query('search') search?: string) {
    return this.service.findAll({ department, shift, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOneOrFail(id);
  }

  @Post()
  create(@Body() dto: CreateWorkerInput) {
    return this.service.create(dto);
  }

  @Post('import')
  bulkImport(@Body() dto: { workers: CreateWorkerInput[] }) {
    return this.service.bulkImport(dto.workers);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateWorkerInput> & { isActive?: boolean }) {
    return this.service.update(id, dto);
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() dto: { newPassword: string }) {
    return this.service.resetPassword(id, dto.newPassword);
  }
}
