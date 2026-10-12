# Tasks: Hospedagem no Coolify

## Imagens e configuração
- [X] T001 API: `prisma` já estava em `dependencies` (nada a mudar); `docker/prod-entrypoint.sh` (migrate deploy + start); `TRUST_PROXY` no `env.ts` e `app.set('trust proxy')`; teste da leitura da variável
- [X] T002 Tela: mover o script de tema para `public/theme-init.js`; estágios `build` e `runtime` (nginx sem root) no `Dockerfile`; `docker/nginx.conf` (SPA, `/api` e `/health` para a API, cabeçalhos, cache)
- [X] T003 `docker-compose.coolify.yml` e `.env.coolify.example` (banco interno, volume, healthchecks, variáveis obrigatórias)

## Verificação
- [X] T004 Subir o Compose de produção localmente com variáveis de teste: saúde dos 3 serviços, migrations aplicadas, tela e `/api` pelo mesmo endereço, cabeçalhos de segurança, banco sem porta publicada
- [X] T005 Lint, tipos e todos os testes (API e tela); confirmar que o `docker compose up` local segue igual; varredura de segredos

## Entrega
- [X] T006 `infrastructure/coolify/README.md` (criar, variáveis, domínio, Keycloak, primeira publicação, atualizar, voltar atrás, backup e restauração) e atualizar README e `AGENTS.md` (lacuna fechada)
- [ ] T007 Com a pessoa: criar o recurso no Coolify, cadastrar os endereços no Keycloak, primeira publicação e teste de ponta a ponta (SC-001); testar backup e restauração
