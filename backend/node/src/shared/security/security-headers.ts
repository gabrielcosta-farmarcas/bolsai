import helmet from 'helmet';
import { env } from '../../config/env.js';

// A API só devolve JSON e redirecionamentos: nada de scripts, estilos ou imagens de fora.
// (A tela, servida pelo Vite, usa a mesma ideia em frontend/react/vite.config.ts.)
export const securityHeaders = () =>
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    hsts: env.NODE_ENV === 'production' ? { maxAge: 15_552_000, includeSubDomains: true } : false,
  });
