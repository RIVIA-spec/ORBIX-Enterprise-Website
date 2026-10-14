import type { DecodedIdToken } from 'firebase-admin/auth';

export interface TokenVerifier {
  verifyIdToken(token: string): Promise<DecodedIdToken>;
}
