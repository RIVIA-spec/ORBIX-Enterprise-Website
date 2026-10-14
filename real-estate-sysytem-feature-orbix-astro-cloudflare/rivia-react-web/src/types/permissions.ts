export const permissions = [
  'org.read',
  'org.update',
  'team.read',
  'team.invite',
  'team.role.update',
  'team.disable',
  'properties.read',
  'properties.create',
  'properties.update',
  'properties.archive',
  'properties.publish',
  'properties.assign',
  'owners.read',
  'owners.create',
  'owners.update',
  'leads.read',
  'leads.create',
  'leads.update',
  'leads.assign',
  'leads.archive',
  'customers.read',
  'customers.create',
  'customers.update',
  'viewings.read',
  'viewings.create',
  'viewings.update',
  'viewings.cancel',
  'deals.read',
  'deals.create',
  'deals.update',
  'deals.close',
  'contracts.read',
  'contracts.create',
  'contracts.manage',
  'commissions.read',
  'commissions.manage',
  'documents.read',
  'documents.upload',
  'documents.delete',
  'reports.read',
  'activity.read',
  'settings.manage',
] as const;

export type Permission = (typeof permissions)[number];

export const agencyRoles = [
  'owner',
  'manager',
  'agent',
  'marketing',
  'photographer',
  'accountant',
] as const;

export type OrganizationRole = (typeof agencyRoles)[number];
export type AgencyRole = OrganizationRole;

export type PermissionOverrides = Partial<Record<Permission, boolean>>;

export const allPermissions: readonly Permission[] = permissions;

const ownerPermissions = permissions;

const managerPermissions = permissions.filter((permission) => permission !== 'settings.manage');

const agentPermissions = [
  'properties.read',
  'properties.create',
  'properties.update',
  'leads.read',
  'leads.create',
  'leads.update',
  'customers.read',
  'customers.update',
  'viewings.read',
  'viewings.create',
  'viewings.update',
  'viewings.cancel',
  'deals.read',
  'deals.create',
  'deals.update',
  'contracts.read',
  'commissions.read',
] as const satisfies readonly Permission[];

const marketerPermissions = [
  'properties.read',
  'properties.update',
  'properties.publish',
  'documents.read',
  'documents.upload',
  'reports.read',
] as const satisfies readonly Permission[];

const photographerPermissions = [
  'properties.read',
  'documents.read',
  'documents.upload',
] as const satisfies readonly Permission[];

const accountantPermissions = [
  'deals.read',
  'contracts.read',
  'commissions.read',
  'commissions.manage',
  'reports.read',
] as const satisfies readonly Permission[];

export const roleToPermissions: Readonly<Record<OrganizationRole, readonly Permission[]>> = {
  owner: ownerPermissions,
  manager: managerPermissions,
  agent: agentPermissions,
  marketing: marketerPermissions,
  photographer: photographerPermissions,
  accountant: accountantPermissions,
};

const roleOverrideCaps: Readonly<Record<OrganizationRole, readonly Permission[]>> = {
  owner: ownerPermissions,
  manager: managerPermissions,
  agent: agentPermissions,
  marketing: marketerPermissions,
  photographer: photographerPermissions,
  accountant: accountantPermissions,
};

export function isAgencyRole(role: unknown): role is OrganizationRole {
  return typeof role === 'string' && (agencyRoles as readonly string[]).includes(role);
}

export const isOrganizationRole = isAgencyRole;

export function isPermission(permission: unknown): permission is Permission {
  return typeof permission === 'string' && (permissions as readonly string[]).includes(permission);
}

export function isAgencyOwner(role: unknown): role is 'owner' {
  return role === 'owner';
}

export function isAgencyManager(role: unknown): role is 'manager' {
  return role === 'manager';
}

export function getRolePermissions(role: unknown): readonly Permission[] {
  if (!isAgencyRole(role)) return [];
  return roleToPermissions[role];
}

function canOverrideGrant(role: OrganizationRole, permission: Permission): boolean {
  return roleOverrideCaps[role].includes(permission);
}

export function hasPermission(
  role: unknown,
  permission: Permission,
  overrides: PermissionOverrides = {},
): boolean {
  if (!isAgencyRole(role)) return false;
  if (overrides[permission] === false) return false;
  if (roleToPermissions[role].includes(permission)) return true;
  return overrides[permission] === true && canOverrideGrant(role, permission);
}

export function hasAnyPermission(
  role: unknown,
  requestedPermissions: readonly Permission[],
  overrides: PermissionOverrides = {},
): boolean {
  if (requestedPermissions.length === 0) return false;
  return requestedPermissions.some((permission) => hasPermission(role, permission, overrides));
}

export function hasAllPermissions(
  role: unknown,
  requestedPermissions: readonly Permission[],
  overrides: PermissionOverrides = {},
): boolean {
  if (requestedPermissions.length === 0) return true;
  return requestedPermissions.every((permission) => hasPermission(role, permission, overrides));
}

export function canManageRole(actorRole: unknown, targetRole: unknown): boolean {
  if (!isAgencyRole(actorRole) || !isAgencyRole(targetRole)) return false;
  if (actorRole === 'owner') return targetRole !== 'owner';
  if (actorRole === 'manager') {
    return targetRole !== 'owner' && targetRole !== 'manager';
  }
  return false;
}

export function canChangeMemberRole(actorRole: unknown, targetRole: unknown, isSelf: boolean): boolean {
  if (isSelf) return false;
  return canManageRole(actorRole, targetRole);
}

// Resource ownership and assignment checks are intentionally not modeled here.
// Services and Firestore rules must later scope assigned resources by organizationId.
