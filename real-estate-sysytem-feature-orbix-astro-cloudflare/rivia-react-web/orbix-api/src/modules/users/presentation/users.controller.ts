import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { FirebaseAuthGuard } from '../../identity/guards/firebase-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { UsersService } from '../application/users.service';
import { UpdateUserRoleDto, UpdateUserStatusDto } from '../dto/admin-update-user.dto';
import { UpdateMeDto } from '../dto/update-me.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('users/me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.users.ensureCurrentUser(user);
  }

  @Patch('users/me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user, dto);
  }

  @Get('admin/users')
  @Roles('admin', 'moderator')
  list(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    return this.users.list(Math.min(Number(limit ?? 20), 100), cursor);
  }

  @Get('admin/users/:uid')
  @Roles('admin', 'moderator')
  get(@Param('uid') uid: string) {
    return this.users.get(uid);
  }

  @Patch('admin/users/:uid/status')
  @Roles('admin', 'moderator')
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param('uid') uid: string, @Body() dto: UpdateUserStatusDto) {
    return this.users.updateStatus(user, uid, dto.status);
  }

  @Patch('admin/users/:uid/role')
  @Roles('admin')
  updateRole(@CurrentUser() user: AuthenticatedUser, @Param('uid') uid: string, @Body() dto: UpdateUserRoleDto) {
    return this.users.updateRole(user, uid, dto.role);
  }
}
