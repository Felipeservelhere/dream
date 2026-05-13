import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../database/entities/user.entity';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) =>
  Reflect.metadata(ROLES_KEY, roles);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.OWNER]: 80,
  [UserRole.ADMIN]: 60,
  [UserRole.MANAGER]: 40,
  [UserRole.ATTENDANT]: 20,
  [UserRole.VIEWER]: 10,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException();

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const hasRole = requiredRoles.some(
      (r) => userLevel >= ROLE_HIERARCHY[r],
    );

    if (!hasRole) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
