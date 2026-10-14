import { beforeEach, describe, expect, it, vi } from 'vitest';

const tokenMock = vi.hoisted(() => vi.fn());

vi.mock('./firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: tokenMock,
    },
  },
}));

import { OrbixApiError, orbixApiRequest } from './api/orbixApiClient';
import {
  buildCreateLeadPayload,
  createLeadWithConfiguredGateway,
  getLeadSubmissionErrorMessage,
  shouldBlockLeadSubmission,
  type CreateLeadInput,
  type LeadGateway,
} from './leadGateway';

const baseInput: CreateLeadInput = {
  type: 'property_inquiry',
  propertyId: 'property-123',
  name: 'Customer Name',
  phone: '+963999111222',
  email: 'customer@example.com',
  message: 'I am interested in this property.',
  source: 'web',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('orbix api client', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    tokenMock.mockReset();
  });

  it('uses VITE_ORBIX_API_URL and sends the current Firebase ID token', async () => {
    vi.stubEnv('VITE_ORBIX_API_URL', 'http://localhost:3000/api/v1');
    tokenMock.mockResolvedValue('firebase-id-token');
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ id: 'lead-1' }));

    await orbixApiRequest('/leads', {
      method: 'POST',
      body: { type: 'property_inquiry' },
      fetchFn,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/leads',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer firebase-id-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('rejects authenticated requests when no Firebase token is available', async () => {
    tokenMock.mockResolvedValue(null);
    const fetchFn = vi.fn();

    await expect(orbixApiRequest('/leads', { method: 'POST', fetchFn })).rejects.toMatchObject({
      code: 'unauthenticated',
      status: 401,
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'validation_error'],
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [429, 'rate_limited'],
    [500, 'server_error'],
  ] as const)('maps HTTP %s to %s', async (status, code) => {
    tokenMock.mockResolvedValue('firebase-id-token');
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ message: 'failed' }, status));

    await expect(orbixApiRequest('/leads', { method: 'POST', fetchFn })).rejects.toMatchObject({
      code,
      status,
    });
  });

  it('maps network and timeout failures without logging tokens', async () => {
    tokenMock.mockResolvedValue('secret-token');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const networkFetch = vi.fn().mockRejectedValue(new Error('offline'));
    const timeoutFetch = vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError'));

    await expect(orbixApiRequest('/leads', { method: 'POST', fetchFn: networkFetch })).rejects.toMatchObject({
      code: 'network_error',
    });
    await expect(orbixApiRequest('/leads', { method: 'POST', fetchFn: timeoutFetch })).rejects.toMatchObject({
      code: 'timeout',
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('lead gateway selection', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps the legacy path when the feature flag is disabled', async () => {
    vi.stubEnv('VITE_USE_ORBIX_API', 'false');
    const legacyCreate = vi.fn().mockResolvedValue({ id: 'legacy-1', backend: 'legacy' });
    const gateway: LeadGateway = { createLead: vi.fn() };

    const result = await createLeadWithConfiguredGateway(baseInput, legacyCreate, gateway);

    expect(result).toEqual({ id: 'legacy-1', backend: 'legacy' });
    expect(legacyCreate).toHaveBeenCalledOnce();
    expect(gateway.createLead).not.toHaveBeenCalled();
  });

  it('uses NestJS only when the feature flag is enabled', async () => {
    vi.stubEnv('VITE_USE_ORBIX_API', 'true');
    const legacyCreate = vi.fn();
    const gateway: LeadGateway = { createLead: vi.fn().mockResolvedValue({ id: 'lead-1', backend: 'orbix' }) };

    const result = await createLeadWithConfiguredGateway(baseInput, legacyCreate, gateway);

    expect(result).toEqual({ id: 'lead-1', backend: 'orbix' });
    expect(gateway.createLead).toHaveBeenCalledWith(baseInput);
    expect(legacyCreate).not.toHaveBeenCalled();
  });

  it('does not fallback to legacy Firestore writes when NestJS fails', async () => {
    vi.stubEnv('VITE_USE_ORBIX_API', 'true');
    const legacyCreate = vi.fn();
    const gateway: LeadGateway = {
      createLead: vi.fn().mockRejectedValue(new OrbixApiError('Unauthorized', 'unauthenticated', 401)),
    };

    await expect(createLeadWithConfiguredGateway(baseInput, legacyCreate, gateway)).rejects.toMatchObject({
      code: 'unauthenticated',
    });
    expect(legacyCreate).not.toHaveBeenCalled();
  });

  it('allowlists the NestJS DTO fields and omits client-owned identity fields', () => {
    const payload = buildCreateLeadPayload({
      ...baseInput,
      customerUid: 'client-uid',
      userId: 'client-user',
      role: 'admin',
      partnerId: 'partner-from-client',
      status: 'closed',
      assignedTo: 'agent',
      createdAt: 'now',
      updatedAt: 'now',
    } as CreateLeadInput & Record<string, unknown>);

    expect(payload).toEqual({
      type: 'property_inquiry',
      propertyId: 'property-123',
      name: 'Customer Name',
      phone: '+963999111222',
      email: 'customer@example.com',
      message: 'I am interested in this property.',
      source: 'web',
    });
    expect(payload).not.toHaveProperty('customerUid');
    expect(payload).not.toHaveProperty('userId');
    expect(payload).not.toHaveProperty('role');
    expect(payload).not.toHaveProperty('partnerId');
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('assignedTo');
    expect(payload).not.toHaveProperty('createdAt');
    expect(payload).not.toHaveProperty('updatedAt');
  });

  it('prevents duplicate submit attempts while loading', () => {
    expect(shouldBlockLeadSubmission(true, true)).toBe(true);
    expect(shouldBlockLeadSubmission(false, false)).toBe(true);
    expect(shouldBlockLeadSubmission(false, true)).toBe(false);
  });

  it('returns user-facing messages for 401, 403, and validation errors', () => {
    expect(getLeadSubmissionErrorMessage(new OrbixApiError('', 'unauthenticated', 401))).toContain('الجلسة');
    expect(getLeadSubmissionErrorMessage(new OrbixApiError('', 'forbidden', 403))).toContain('صلاحية');
    expect(getLeadSubmissionErrorMessage(new OrbixApiError('', 'validation_error', 400))).toContain('بيانات');
  });
});
