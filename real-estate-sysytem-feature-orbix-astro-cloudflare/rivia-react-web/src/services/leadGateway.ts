import { isOrbixApiEnabled, OrbixApiError, orbixApiRequest } from './api/orbixApiClient';

export type CreateLeadType = 'property_inquiry' | 'viewing_request' | 'partnership_request';
export type CreateLeadSource = 'web';

export type CreateLeadInput = {
  type: CreateLeadType;
  propertyId?: string;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  source?: CreateLeadSource;
};

export type LeadResult = {
  id: string;
  backend: 'orbix' | 'legacy';
};

export type LeadGateway = {
  createLead(input: CreateLeadInput): Promise<LeadResult>;
};

export type LegacyLeadCreator = () => Promise<LeadResult>;

type ApiLeadResponse = {
  id: string;
};

function cleanText(value?: string): string | undefined {
  const text = value?.trim();
  return text ? text : undefined;
}

export function buildCreateLeadPayload(input: CreateLeadInput): Record<string, unknown> {
  return {
    type: input.type,
    ...(cleanText(input.propertyId) ? { propertyId: cleanText(input.propertyId) } : {}),
    name: cleanText(input.name) ?? '',
    ...(cleanText(input.phone) ? { phone: cleanText(input.phone) } : {}),
    ...(cleanText(input.email) ? { email: cleanText(input.email) } : {}),
    ...(cleanText(input.message) ? { message: cleanText(input.message) } : {}),
    source: input.source ?? 'web',
  };
}

export function shouldBlockLeadSubmission(isSubmitting: boolean, hasAuthenticatedUser: boolean): boolean {
  return isSubmitting || !hasAuthenticatedUser;
}

export class NestLeadGateway implements LeadGateway {
  async createLead(input: CreateLeadInput): Promise<LeadResult> {
    const lead = await orbixApiRequest<ApiLeadResponse>('/leads', {
      method: 'POST',
      body: buildCreateLeadPayload(input),
      authRequired: true,
    });

    return {
      id: lead.id,
      backend: 'orbix',
    };
  }
}

export async function createLeadWithConfiguredGateway(
  input: CreateLeadInput,
  legacyCreate: LegacyLeadCreator,
  gateway: LeadGateway = new NestLeadGateway(),
): Promise<LeadResult> {
  if (!isOrbixApiEnabled()) {
    return legacyCreate();
  }

  return gateway.createLead(input);
}

export function getLeadSubmissionErrorMessage(error: unknown): string {
  if (error instanceof OrbixApiError) {
    if (error.code === 'unauthenticated') return 'انتهت الجلسة أو تحتاج إلى تسجيل الدخول مرة أخرى.';
    if (error.code === 'forbidden') return 'لا تملك صلاحية إرسال هذا الطلب.';
    if (error.code === 'not_found') return 'العقار غير موجود أو لم يعد متاحا.';
    if (error.code === 'validation_error') return 'يرجى مراجعة بيانات الطلب والمحاولة مرة أخرى.';
    if (error.code === 'conflict') return 'تم إرسال طلب مشابه مؤخرا. يرجى الانتظار قليلا قبل إعادة المحاولة.';
    if (error.code === 'timeout' || error.code === 'network_error') return 'تعذر الاتصال بالخادم. تحقق من الشبكة ثم حاول مرة أخرى.';
    if (error.code === 'server_error') return 'تعذر إنشاء الطلب حاليا بسبب خطأ في الخادم.';
  }

  return 'تعذر إرسال الطلب حاليا. حاول مرة أخرى لاحقا.';
}
