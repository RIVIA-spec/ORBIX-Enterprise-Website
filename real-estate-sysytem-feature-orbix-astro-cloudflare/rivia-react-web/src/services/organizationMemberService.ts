import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { OrganizationMember } from '../types/organization';
import type { OrganizationRole } from '../types/permissions';

export type OrganizationMemberInput = {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status?: OrganizationMember['status'];
  branchIds?: string[];
};

export function getOrganizationMembershipId(organizationId: string, userId: string): string {
  return `${organizationId}_${userId}`;
}

function fromOrganizationMemberDoc(id: string, data: Record<string, unknown>): OrganizationMember {
  return {
    id,
    ...(data as Omit<OrganizationMember, 'id'>),
    branchIds: Array.isArray(data.branchIds) ? data.branchIds.map(String).filter(Boolean) : [],
  };
}

export async function getOrganizationMember(organizationId: string, userId: string): Promise<OrganizationMember | null> {
  const snap = await getDoc(doc(db, 'organization_members', getOrganizationMembershipId(organizationId, userId)));
  if (!snap.exists()) return null;
  return fromOrganizationMemberDoc(snap.id, snap.data());
}

export async function listActiveMembershipsForUser(userId: string): Promise<OrganizationMember[]> {
  const snap = await getDocs(
    query(
      collection(db, 'organization_members'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
    ),
  );
  return snap.docs.map((item) => fromOrganizationMemberDoc(item.id, item.data()));
}

export async function listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const snap = await getDocs(query(collection(db, 'organization_members'), where('organizationId', '==', organizationId)));
  return snap.docs.map((item) => fromOrganizationMemberDoc(item.id, item.data()));
}

export async function upsertOrganizationMember(input: OrganizationMemberInput): Promise<string> {
  const membershipId = getOrganizationMembershipId(input.organizationId, input.userId);
  await setDoc(
    doc(db, 'organization_members', membershipId),
    {
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      status: input.status || 'active',
      branchIds: input.branchIds || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return membershipId;
}

export async function updateOrganizationMember(
  membershipId: string,
  fields: Partial<Pick<OrganizationMember, 'role' | 'status' | 'branchIds'>>,
): Promise<void> {
  await updateDoc(doc(db, 'organization_members', membershipId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}
