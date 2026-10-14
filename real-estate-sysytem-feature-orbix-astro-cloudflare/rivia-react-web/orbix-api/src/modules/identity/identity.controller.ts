import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('auth')
@Controller('auth')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IdentityController {
  @Get('me')
  @ApiOkResponse({ description: 'Returns the authenticated Firebase user mapped to Orbix roles.' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      roles: user.roles
    };
  }
}
