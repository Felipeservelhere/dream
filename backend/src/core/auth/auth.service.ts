import {
  Injectable, UnauthorizedException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: {
    name: string;
    email: string;
    password: string;
    tenantId?: string;
    role?: UserRole;
  }): Promise<{ user: User; token: string }> {
    const exists = await this.userRepo.findOne({ where: { email: data.email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = this.userRepo.create({
      name: data.name,
      email: data.email,
      passwordHash,
      tenantId: data.tenantId,
      role: data.role || UserRole.ATTENDANT,
    });

    const saved = await this.userRepo.save(user);
    const token = this.generateToken(saved);
    return { user: saved, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account suspended');

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    const token = this.generateToken(user);
    return { user, token };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId, isActive: true } });
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });
  }
}
