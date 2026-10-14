import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export type AdminEmailType =
  | 'PROPERTY_PURCHASE_REQUEST'
  | 'PROPERTY_BOOKING_REQUEST'
  | 'PROPERTY_SUBMISSION'
  | 'VERIFICATION_SUBMISSION'
  | 'CONTRACT_REQUEST';

export type AdminNotificationMetadata = Record<string, unknown>;

export type AdminEmailRequest = {
  type: AdminEmailType;
  relatedId?: string;
  event: string;
  summary: string;
  metadata: AdminNotificationMetadata;
};

export function cleanMetadata(metadata: AdminNotificationMetadata): AdminNotificationMetadata {
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}

function getCallableEmailType(type: AdminEmailType): string {
  if (type === 'PROPERTY_PURCHASE_REQUEST') return 'purchase';
  if (type === 'PROPERTY_BOOKING_REQUEST') return 'property_booking';
  if (type === 'PROPERTY_SUBMISSION') return 'property_submission';
  if (type === 'VERIFICATION_SUBMISSION') return 'verification_submission';
  return 'contract_request';
}

export async function createContractForDeal(dealId: string): Promise<void> {
  if (!dealId?.trim()) {
    throw new Error('invalid-deal-id');
  }
  const callable = httpsCallable(functions, 'createContractForDeal');
  await callable({ dealId });
}

export async function queueAdminEmail(type: AdminEmailType, relatedId: string): Promise<void>;
export async function queueAdminEmail(request: AdminEmailRequest): Promise<void>;
export async function queueAdminEmail(typeOrRequest: AdminEmailType | AdminEmailRequest, relatedId?: string): Promise<void> {
  const request: AdminEmailRequest = typeof typeOrRequest === 'string'
    ? {
        type: typeOrRequest,
        relatedId,
        event: typeOrRequest.toLowerCase(),
        summary: 'Rivia admin notification',
        metadata: {},
      }
    : typeOrRequest;
  const type = request.type;
  const allowedTypes: AdminEmailType[] = [
    'PROPERTY_PURCHASE_REQUEST',
    'PROPERTY_BOOKING_REQUEST',
    'PROPERTY_SUBMISSION',
    'VERIFICATION_SUBMISSION',
    'CONTRACT_REQUEST',
  ];
  if (!allowedTypes.includes(type)) {
    throw new Error('invalid-email-type');
  }
  const cleanedMetadata = cleanMetadata(request.metadata);
  const effectiveRelatedId = request.relatedId || String(cleanedMetadata.dealId || cleanedMetadata.bookingId || cleanedMetadata.propertyId || '');
  if (!effectiveRelatedId.trim()) {
    throw new Error('invalid-related-id');
  }
  const payload = {
    type,
    relatedId: effectiveRelatedId,
    emailType: getCallableEmailType(type),
    event: request.event,
    summary: request.summary,
    metadata: cleanedMetadata,
    ...cleanedMetadata,
  };
  if (import.meta.env.DEV) {
    console.info('[Admin notification payload]', payload);
  }
  const callable = httpsCallable(functions, 'queueAdminEmail');
  await callable(payload);
}
