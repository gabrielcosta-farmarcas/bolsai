import { config } from 'dotenv';
import { z } from 'zod';

config();

const DEFAULT_TRANSCRIPT_MAX_CHARS = 200_000;

// Vazio no .env.example vira undefined: a análise avisa que falta configurar.
const optionalText = z
  .string()
  .optional()
  .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined));

// Chave de 32 bytes em base64 (openssl rand -base64 32), usada para cifrar tokens e o cookie de login.
const encryptionKey = optionalText.refine(
  (value) => value === undefined || Buffer.from(value, 'base64').length === 32,
  'SESSION_ENCRYPTION_KEY deve ser 32 bytes em base64 (openssl rand -base64 32)',
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: optionalText,
  ANTHROPIC_MODEL: optionalText,
  TRANSCRIPT_MAX_CHARS: z.coerce.number().int().positive().default(DEFAULT_TRANSCRIPT_MAX_CHARS),
  // Login (Keycloak). Sem isto a API sobe, mas o login responde que falta configurar.
  KEYCLOAK_ISSUER: optionalText.pipe(z.string().url().optional()),
  KEYCLOAK_CLIENT_ID: z.string().min(1).default('bonsai-web'),
  KEYCLOAK_CLIENT_SECRET: optionalText,
  SESSION_ENCRYPTION_KEY: encryptionKey,
  // Endereço público da tela (o navegador fala só com ele; a API fica atrás do mesmo endereço).
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  // Quantos servidores intermediários (proxies) ficam entre o navegador e a API. 0 = nenhum (local).
  // Na hospedagem são 2 (proxy do Coolify + nginx da tela): assim o limite de tentativas conta o IP real.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
});

// Em teste os valores de login são fixos (o Keycloak é simulado); nunca vão para outro ambiente.
const TEST_AUTH_DEFAULTS = {
  KEYCLOAK_ISSUER: 'https://keycloak.test/realms/bonsai',
  KEYCLOAK_CLIENT_SECRET: 'segredo-de-teste',
  SESSION_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
};

const parsed = envSchema.parse(
  process.env.NODE_ENV === 'test' ? { ...TEST_AUTH_DEFAULTS, ...process.env } : process.env,
);

const MISSING_IN_PRODUCTION = [
  'KEYCLOAK_ISSUER',
  'KEYCLOAK_CLIENT_SECRET',
  'SESSION_ENCRYPTION_KEY',
] as const;
if (parsed.NODE_ENV === 'production') {
  const missing = MISSING_IN_PRODUCTION.filter((name) => !parsed[name]);
  if (missing.length > 0) {
    throw new Error(`Faltam variáveis de segurança em produção: ${missing.join(', ')}`);
  }
}

export const env = parsed;
