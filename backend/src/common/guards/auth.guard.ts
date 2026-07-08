import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyAuthToken } from '../auth/token';
import { IS_PUBLIC_ROUTE } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Acesso negado.');
    }

    const token = authorization.replace('Bearer ', '').trim();
    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      throw new UnauthorizedException('Autenticacao indisponivel.');
    }

    const payload = verifyAuthToken(token, secret);

    if (!payload) {
      throw new UnauthorizedException('Sessao invalida ou expirada.');
    }

    request.authUser = payload;

    return true;
  }
}
