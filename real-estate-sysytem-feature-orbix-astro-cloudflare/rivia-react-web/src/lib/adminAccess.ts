import type { UserProfile } from '../types/models';

type AdminProfile = Partial<UserProfile> & Record<string, unknown>;

function isEnabled(value: unknown): boolean {
  return value === true || value === 1 || String(value ?? '').trim().toLowerCase() === 'true';
}

function normalizedRole(profile?: AdminProfile | null): string {
  return String(profile?.role || profile?.userRole || profile?.user_role || profile?.accountType || '').trim().toLowerCase();
}

export function isOwnerProfile(profile?: AdminProfile | null): boolean {
  return Boolean(profile) && (normalizedRole(profile) === 'owner' || isEnabled(profile?.isAppOwner) || isEnabled(profile?.isOwner));
}

export function hasAdminAccess(profile?: AdminProfile | null): boolean {
  if (!profile) return false;
  const role = normalizedRole(profile);
  return ['admin', 'owner', 'staff', 'superadmin', 'super_admin', 'moderator'].includes(role) || isEnabled(profile.isAdmin) || isEnabled(profile.isStaff) || isEnabled(profile.staff) || isOwnerProfile(profile);
}

export function hasCookieSettingsAccess(profile?: AdminProfile | null): boolean {
  if (!profile) return false;
  const role = normalizedRole(profile);
  return ['admin', 'owner', 'superadmin', 'super_admin'].includes(role) || isEnabled(profile.isAdmin) || isOwnerProfile(profile);
}

export function getAdminRoleLabel(profile?: AdminProfile | null): string {
  if (isOwnerProfile(profile)) return 'مالك';
  return hasAdminAccess(profile) ? 'مشرف' : 'مستخدم';
}
