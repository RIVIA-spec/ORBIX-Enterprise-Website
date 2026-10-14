import { SetMetadata } from '@nestjs/common';
import type { OrbixRole } from '../types/authenticated-user';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: OrbixRole[]) => SetMetadata(ROLES_KEY, roles);
