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
import { listActiveMembershipsForUser, upsertOrganizationMember } from './organizationMemberService';
import type { Organization, OrganizationMember, OrganizationType } from '../types/organization';

export type OrganizationInput = {
  name: string;
  slug: string;
  type: OrganizationType;
  ownerUserId: string;
  status?: Organization['status'];
  logoUrl?: string;
  subscriptionPlan?: string;
};

export type UserOrganization = {
  organization: Organization;
  membership: OrganizationMember;
};

function fromOrganizationDoc(id: string, data: Record<string, unknown>): Organization {
  return { id, ...(data as Omit<Organization, 'id'>) };
}

export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  const snap = await getDoc(doc(db, 'organizations', organizationId));
  if (!snap.exists()) return null;
  return fromOrganizationDoc(snap.id, snap.data());
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const snap = await getDocs(query(collection(db, 'organizations'), where('slug', '==', slug)));
  const first = snap.docs[0];
  return first ? fromOrganizationDoc(first.id, first.data()) : null;
}

export async function listUserOrganizations(userId: string): Promise<UserOrganization[]> {
  const memberships = await listActiveMembershipsForUser(userId);
  const organizations = await Promise.all(memberships.map((item) => getOrganizationById(item.organizationId)));
  return memberships.reduce<UserOrganization[]>((items, membership, index) => {
    const organization = organizations[index];
    if (organization) items.push({ organization, membership });
    return items;
  }, []);
}

export async function createOrganization(input: OrganizationInput): Promise<string> {
  const organizationRef = doc(collection(db, 'organizations'));
  await setDoc(organizationRef, {
    name: input.name,
    slug: input.slug,
    type: input.type,
    status: input.status || 'pending_approval',
    logoUrl: input.logoUrl || '',
    ownerUserId: input.ownerUserId,
    subscriptionPlan: input.subscriptionPlan || 'trial',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await upsertOrganizationMember({
    organizationId: organizationRef.id,
    userId: input.ownerUserId,
    role: 'owner',
    status: 'active',
  });
  return organizationRef.id;
}

export async function updateOrganization(
  organizationId: string,
  fields: Partial<Pick<Organization, 'name' | 'slug' | 'status' | 'logoUrl' | 'subscriptionPlan'>>,
): Promise<void> {
  await updateDoc(doc(db, 'organizations', organizationId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}
