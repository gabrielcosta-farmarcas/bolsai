import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

// AES-256-GCM: cifra e garante que o texto não foi alterado. Formato: v1.iv.tag.cifrado (base64url).
const VERSION = 'v1';
const IV_BYTES = 12;

export const loadKey = (base64Key: string): Buffer => {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) throw new Error('A chave de cifra deve ter 32 bytes.');
  return key;
};

export const encrypt = (plainText: string, key: Buffer): string => {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return [VERSION, iv, cipher.getAuthTag(), body]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join('.');
};

// Devolve null se o texto foi adulterado, veio de outra chave ou está mal formado.
export const decrypt = (payload: string, key: Buffer): string | null => {
  const [version, iv, tag, body, extra] = payload.split('.');
  if (version !== VERSION || !iv || !tag || body === undefined || extra !== undefined) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(body, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
};

export const newSessionToken = (): string => randomBytes(32).toString('base64url');

// O banco guarda só o hash do valor do cookie: se o banco vazar, as sessões não servem a ninguém.
export const hashSessionToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
