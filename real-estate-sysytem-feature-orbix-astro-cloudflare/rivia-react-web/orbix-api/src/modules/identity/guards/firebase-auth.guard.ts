import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { FirebaseTokenVerifier } from '../../firebase/firebase-token-verifier.service';
import { IdentityService } from '../identity.service';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

function bearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token?.trim()) return null;
  return token.trim();
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly tokenVerifier: FirebaseTokenVerifier,
    private readonly identityService: IdentityService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(request.header('authorization'));
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const decoded = await this.tokenVerifier.verifyIdToken(token);
      request.user = await this.identityService.buildAuthenticatedUser(decoded);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }
}
