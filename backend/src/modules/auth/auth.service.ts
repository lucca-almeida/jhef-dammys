import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { hashPassword, verifyPassword } from '../../common/auth/password';
import { createAuthToken } from '../../common/auth/token';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureAdminUser();
  }

  private sanitizeUser(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private async ensureAdminUser() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD?.trim();
    const name = process.env.ADMIN_NAME?.trim() || 'Administrador';

    if (!email || !password) {
      return;
    }

    const passwordHash = await hashPassword(password);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      return;
    }

    await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha invalidos.');
    }

    const passwordIsValid = await verifyPassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Email ou senha invalidos.');
    }

    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      throw new UnauthorizedException('AUTH_SECRET nao configurado.');
    }

    return {
      token: createAuthToken(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        secret,
      ),
      user: this.sanitizeUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado.');
    }

    return this.sanitizeUser(user);
  }
}
