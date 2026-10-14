export interface FirebaseServiceAccountFields {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

type ServiceAccountJson = {
  project_id?: unknown;
  client_email?: unknown;
  private_key?: unknown;
};

const invalidCredentialMessage =
  'FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 must contain a valid base64-encoded Firebase service account JSON';

export function decodeFirebaseServiceAccountBase64(
  encodedCredential?: string
): FirebaseServiceAccountFields {
  const compactCredential = encodedCredential?.trim().replace(/\s/g, '');

  if (
    !compactCredential ||
    compactCredential.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(compactCredential)
  ) {
    throw new Error(invalidCredentialMessage);
  }

  let credential: ServiceAccountJson;

  try {
    const decoded = Buffer.from(compactCredential, 'base64').toString('utf8');
    credential = JSON.parse(decoded) as ServiceAccountJson;
  } catch {
    throw new Error(invalidCredentialMessage);
  }

  if (
    typeof credential.project_id !== 'string' ||
    typeof credential.client_email !== 'string' ||
    typeof credential.private_key !== 'string' ||
    !credential.project_id.trim() ||
    !credential.client_email.trim() ||
    !credential.private_key.includes('-----BEGIN PRIVATE KEY-----')
  ) {
    throw new Error(invalidCredentialMessage);
  }

  return {
    projectId: credential.project_id.trim(),
    clientEmail: credential.client_email.trim(),
    privateKey: credential.private_key
  };
}
