import { Injectable } from '@nestjs/common';
import type { Auth, DecodedIdToken } from 'firebase-admin/auth';
import type { TokenVerifier } from './firebase-token-verifier.interface';

@Injectable()
export class FirebaseTokenVerifier implements TokenVerifier {
  constructor(private readonly auth: Auth) {}

  verifyIdToken(token: string): Promise<DecodedIdToken> {
    return this.auth.verifyIdToken(token, true);
  }
}
