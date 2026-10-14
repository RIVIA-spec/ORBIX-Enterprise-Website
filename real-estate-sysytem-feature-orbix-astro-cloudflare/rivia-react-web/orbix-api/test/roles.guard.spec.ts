import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../src/common/types/authenticated-user';
import { RolesGuard } from '../src/modules/identity/guards/roles.guard';

type RequestWithUser = Request & { user?: AuthenticatedUser };

function contextWithUser(user: AuthenticatedUser): ExecutionContext {
  const request = { user } as RequestWithUser;
  return {
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
    switchToHttp: () => ({
      getRequest: () => request
    })
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('rejects users without an authorized role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['admin'])
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(
        contextWithUser({
          uid: 'firebase-user-1',
          email: 'user@example.com',
          roles: ['customer'],
          claims: {}
        })
      )
    ).toThrow(ForbiddenException);
  });
});
