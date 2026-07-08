import { createHmac } from 'node:crypto';

type AuthTokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;

  return Buffer.from(`${padded}${'='.repeat(padLength)}`, 'base64').toString(
    'utf8',
  );
}

function signPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createAuthToken(
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  },
  secret: string,
  expiresInSeconds = 60 * 60 * 24 * 7,
) {
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string, secret: string) {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as AuthTokenPayload;

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
