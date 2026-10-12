import { createHash, randomBytes } from 'node:crypto';

// Peças do login seguro (PKCE + state + nonce). Tudo aleatório e de uso único.
export const newLoginSecrets = () => {
  const verifier = randomBytes(32).toString('base64url');
  return {
    state: randomBytes(16).toString('base64url'),
    nonce: randomBytes(16).toString('base64url'),
    verifier,
    challenge: createHash('sha256').update(verifier).digest('base64url'),
  };
};

const MAX_RETURN_TO = 500;

// Evita "redirecionamento aberto": só aceita caminhos da própria tela.
export const safeReturnTo = (value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_RETURN_TO) return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return '/';
  if (value === '/login' || value.startsWith('/login?') || value.startsWith('/api')) return '/';
  return value;
};
