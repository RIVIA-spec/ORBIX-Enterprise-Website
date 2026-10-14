import { describe, expect, it } from 'vitest';
import {
  allPermissions,
  canChangeMemberRole,
  canManageRole,
  getRolePermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from './permissions';

describe('organization permission helpers', () => {
  it('grants every permission to agency owner', () => {
    expect(getRolePermissions('owner')).toEqual(allPermissions);
    expect(hasAllPermissions('owner', allPermissions)).toBe(true);
  });

  it('does not allow a manager to manage an owner', () => {
    expect(canManageRole('manager', 'owner')).toBe(false);
  });

  it('does not allow users to change their own role', () => {
    expect(canChangeMemberRole('owner', 'agent', true)).toBe(false);
  });

  it('does not allow an agent to manage team roles', () => {
    expect(hasPermission('agent', 'team.role.update')).toBe(false);
    expect(canManageRole('agent', 'marketing')).toBe(false);
  });

  it('does not allow an accountant to edit properties', () => {
    expect(hasPermission('accountant', 'properties.update')).toBe(false);
  });

  it('does not allow a photographer to read deals', () => {
    expect(hasPermission('photographer', 'deals.read')).toBe(false);
  });

  it('lets override false deny an otherwise granted permission', () => {
    expect(hasPermission('owner', 'reports.read', { 'reports.read': false })).toBe(false);
  });

  it('denies unknown roles by default', () => {
    expect(getRolePermissions('unknown')).toEqual([]);
    expect(hasPermission('unknown', 'reports.read')).toBe(false);
  });

  it('handles empty permission arrays consistently', () => {
    expect(hasAnyPermission('owner', [])).toBe(false);
    expect(hasAllPermissions('owner', [])).toBe(true);
  });
});
