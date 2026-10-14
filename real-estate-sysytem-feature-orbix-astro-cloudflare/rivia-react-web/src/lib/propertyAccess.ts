import type { User } from 'firebase/auth';
import { hasAdminAccess } from './adminAccess';
import type { Property, UserProfile } from '../types/models';

export function getPropertyOwnerId(property?: Partial<Property> | null): string {
  if (!property) return '';
  const ownerId =
    property.ownerId ||
    property.ownerUserId ||
    property.userId ||
    property.createdBy ||
    property.postedBy ||
    property.ownerUid ||
    property.created_by;
  return typeof ownerId === 'string' ? ownerId.trim() : '';
}

export function canEditProperty(
  user: Pick<User, 'uid'> | null | undefined,
  profile: UserProfile | null | undefined,
  property: Partial<Property> | null | undefined,
): boolean {
  if (!user || !property) return false;
  if (hasAdminAccess(profile)) return true;
  const ownerId = getPropertyOwnerId(property);
  return Boolean(ownerId && ownerId === user.uid);
}
