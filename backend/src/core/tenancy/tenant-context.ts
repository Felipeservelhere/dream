import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Tenant } from '../../database/entities/tenant.entity';

// Decorator para injetar o tenant atual nas rotas
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Tenant => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);

// Tipo para o contexto de tenant disponível em toda a requisição
export interface TenantContext {
  tenant: Tenant;
  tenantId: string;
}
