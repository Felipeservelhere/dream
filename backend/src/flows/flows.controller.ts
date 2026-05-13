import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../core/auth/guards/roles.guard';
import { CurrentUser } from '../core/auth/decorators/current-user.decorator';
import { User, UserRole } from '../database/entities/user.entity';
import { Flow } from '../database/entities/flow.entity';

@ApiTags('Flows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('flows')
export class FlowsController {
  constructor(@InjectRepository(Flow) private readonly flowRepo: Repository<Flow>) {}

  @Get()
  @ApiOperation({ summary: 'Listar fluxos do tenant' })
  async list(@CurrentUser() user: User) {
    return this.flowRepo.find({
      where: { tenantId: user.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um fluxo' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.flowRepo.findOne({ where: { id, tenantId: user.tenantId } });
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Criar novo fluxo' })
  async create(@Body() body: Partial<Flow>, @CurrentUser() user: User) {
    const flow = this.flowRepo.create({ ...body, tenantId: user.tenantId } as Flow);
    return this.flowRepo.save(flow);
  }

  @Put(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Atualizar fluxo' })
  async update(@Param('id') id: string, @Body() body: Partial<Flow>, @CurrentUser() user: User) {
    await this.flowRepo.update({ id, tenantId: user.tenantId }, body as any);
    return this.flowRepo.findOne({ where: { id } });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Deletar fluxo' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.flowRepo.delete({ id, tenantId: user.tenantId });
    return { ok: true };
  }
}
