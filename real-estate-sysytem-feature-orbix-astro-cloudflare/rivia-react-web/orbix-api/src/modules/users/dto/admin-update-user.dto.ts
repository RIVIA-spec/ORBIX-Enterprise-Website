import { IsIn } from 'class-validator';
import type { UserRole, UserStatus } from '../domain/user-profile';

export class UpdateUserRoleDto {
  @IsIn(['customer', 'partner', 'partner_staff', 'moderator', 'admin'])
  role!: UserRole;
}

export class UpdateUserStatusDto {
  @IsIn(['active', 'suspended', 'pending'])
  status!: UserStatus;
}
