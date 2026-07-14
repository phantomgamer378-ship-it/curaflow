import { randomBytes, createHash } from 'crypto';

export function generateToken() {
  const raw = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash }; // raw goes in the email link, hash goes in the DB
}

export function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}
