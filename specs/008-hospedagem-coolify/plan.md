# Plano: Hospedagem no Coolify

Spec: [spec.md](spec.md). Constitution check: Docker em tudo (II); stack padrão mantida (III); banco só muda por migration (IV, aplicada no deploy); segredos fora do git; local continua igual (FR-011).

## Decisões técnicas

| Escolha | Por quê |
| --- | --- |
| **Um único endereço**: nginx na frente serve a tela pronta e encaminha `/api` e `/health` para a API | O login, o cookie e a proteção contra pedidos forjados exigem mesma origem; sem CORS. |
| Imagem de produção da tela em 3 estágios (dev, build, runtime), runtime `nginx-unprivileged` na porta 8080 | Mesmo padrão da API; roda sem root. |
| Mover o script de tema do `index.html` para `public/theme-init.js` e usar CSP **sem `unsafe-inline` em scripts** | Cumpre a nota do `vite.config.ts` e FR-006. Estilos continuam com `unsafe-inline` (atributos `style` do React). |
| `docker-compose.coolify.yml` na raiz, com `web`, `api`, `postgres`; só `web` recebe domínio | O Coolify publica a partir do Compose; banco e API ficam na rede interna (FR-004). |
| Banco: usuário e senha gerados pelo Coolify (`SERVICE_USER_*`, `SERVICE_PASSWORD_*`), volume nomeado `postgres_data` | Nenhum segredo do banco é digitado nem versionado. |
| `SESSION_ENCRYPTION_KEY` e `KEYCLOAK_CLIENT_SECRET` obrigatórios, vindos do Coolify (`${VAR:?mensagem}`); a pessoa cola | Chave de cifra precisa ter exatamente 32 bytes em base64 (o Coolify não garante); falha cedo e clara se faltar. |
| `prisma` já está em `dependencies`; entrypoint de produção `prisma migrate deploy && node dist/server.js` | A imagem enxuta (`npm ci --omit=dev`) precisa do CLI para migrar; migration que falha derruba a versão nova (FR-003). |
| `trust proxy` configurável (`TRUST_PROXY=2` na hospedagem: Coolify + nginx) | O Coolify (Traefik) fica na frente; sem isso, o limite de tentativas contaria todos como um só IP (FR-006). |
| Healthchecks: `pg_isready`, `/health/ready` (API), `/` (tela); `restart: unless-stopped` | FR-007. |
| Backup: usar a aba **Backups** do Coolify se ela aparecer para o Postgres do Compose; senão, tarefa agendada com `pg_dump` para o volume. Testar a restauração uma vez | FR-008. Depende do que a versão do Coolify oferece. |
| Verificação local do Compose de produção (subir com variáveis de teste, conferir saúde, proxy e migrations) antes de ir ao Coolify | Evita descobrir erro só no servidor. |

## Arquivos

- `docker-compose.coolify.yml`, `.env.coolify.example` (só nomes e exemplos)
- `frontend/react/Dockerfile` (estágios build/runtime), `frontend/react/docker/nginx.conf`, `frontend/react/public/theme-init.js`, `frontend/react/index.html`
- `backend/node/Dockerfile`, `backend/node/docker/prod-entrypoint.sh`, `backend/node/package.json` (+ lock), `backend/node/src/config/env.ts`, `backend/node/src/app.ts` (trust proxy)
- `infrastructure/coolify/README.md` (passo a passo) e ajustes em `infrastructure/keycloak/README.md`
