---
description: "Task list for Segurança — login de verdade e permissões (Keycloak)"
---

# Tasks: Segurança — login de verdade e permissões (Keycloak)

**Input**: `specs/003-seguranca-keycloak/` (spec.md, plan.md) e `infrastructure/keycloak/README.md`

**Tests**: Incluídos (teste antes do código; Vitest + Supertest no back, Vitest + Testing Library na tela). O Keycloak é simulado nos testes por um servidor OIDC falso.

**Format**: `- [ ] T### [P?] [US?] Descrição com caminho do arquivo` — `[P]` = pode andar em paralelo.

**Paths**: API em `backend/node/`, tela em `frontend/react/`, Keycloak em `infrastructure/keycloak/`. Ler antes: `backend/BACKEND.md` + skill `node-api-development` (e `node-unit-testing` para services), `database/DATABASE.md` + `migrations` (banco), `frontend/BRAND.md` + `component-development` (tela), `containerization` (Docker). Comandos rodam nos containers. Aprovação ao fim de cada etapa (A–D).

**Segredos**: nada de segredo no git. O segredo do cliente do Keycloak e a chave de cifra são colocados no `.env` **pela pessoa**; o agente só atualiza o `.env.example`.

## Etapa A — Entrar de verdade e trancar a API (US1, US2)

### A1. Base e configuração

- [X] T001 Ajustar o Keycloak (reino `bonsai`, pelo painel) e documentar em `infrastructure/keycloak/README.md`: cliente `bonsai-web` com *Client authentication* ligado e fluxo padrão + PKCE; redirect `http://localhost:3000/api/v1/auth/callback`; post-logout `http://localhost:3000/login`; *Backchannel logout URL* `http://api:4000/api/v1/auth/backchannel-logout`; *front-channel logout* desligado; **Browser flow** com o código do autenticador (OTP) **obrigatório sempre**
- [X] T002 **(pessoa)** Copiar o segredo do cliente (Clients → bonsai-web → Credentials) e gerar a chave de cifra (`openssl rand -base64 32`) no `.env`, sem colar no chat
- [X] T003 [P] Variáveis `KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `SESSION_ENCRYPTION_KEY`, `APP_BASE_URL` no `.env.example`, no `docker-compose.yml` (serviço `api`) e em `backend/node/src/config/env.ts` (Zod; falha clara se faltar). Espelhar em `templates/`
- [X] T004 [P] Dependências `openid-client`, `helmet`, `express-rate-limit` em `backend/node/package.json` (instalar pelo container; `npm audit` sem falha alta/crítica)

### A2. Banco

- [X] T005 Teste e migration `auth_sessions` (id = hash da sessão, `leader_id` nulo, `subject`, `kc_sid`, `roles`, `id_token`, `refresh_token_enc`, `created_at`, `last_used_at`, `expires_at`, índices em `kc_sid` e `expires_at`) em `backend/node/prisma/` + modelo no `schema.prisma`; segundo ajuste: `leaders.keycloak_subject` único e nulo

### A3. Núcleo de segurança da API

- [X] T006 [P] Teste e `shared/security/session-crypto.ts`: AES-256-GCM (cifrar/decifrar refresh token; recusa dado adulterado)
- [X] T007 [P] Teste e `shared/security/security-headers.ts` (`helmet`: CSP restritiva, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: no-referrer`, HSTS fora do dev)
- [X] T008 [P] Teste e `shared/security/csrf.ts`: toda escrita exige `X-Requested-With: bonsai` e `Origin` igual a `APP_BASE_URL`
- [X] T009 [P] Teste e `shared/security/rate-limit.ts`: limite forte em `/auth/*` e geral na API
- [X] T010 [P] Ampliar o filtro de logs em `shared/logger.ts` (`authorization`, `cookie`, `set-cookie`, `code`, `state`, tokens) + teste que prova que nada vaza
- [X] T011 Teste e `modules/auth/session.repository.ts` + `session.service.ts`: criar (id novo a cada login), buscar por hash, renovar com o Keycloak a cada ~5 min, expirar (30 min parada / 10 h máx.), apagar por `kc_sid`

### A4. Rotas de autenticação

- [X] T012 Keycloak falso para testes em `backend/node/src/test/fake-oidc.ts`, injetado no lugar do real (mais simples que um servidor HTTP falso; o real foi conferido à mão: descoberta, PKCE e endereço de saída)
- [X] T013 [US1] Teste e `modules/auth/` (`oidc-client.ts`, `auth.routes.ts`, `auth.controller.ts`): `GET /auth/login` (state, nonce, PKCE em cookie curto), `GET /auth/callback` (valida assinatura, emissor, público, nonce, validade; recusa `state`/`nonce` inválidos), `GET /auth/me`, `POST /auth/logout` (apaga e encerra no Keycloak), `POST /auth/backchannel-logout` (valida o *logout token*)
- [X] T014 [US2] Teste e `shared/security/require-auth.ts` + `current-user.ts` com `AsyncLocalStorage` (`getCurrentUser()` lê o usuário da requisição e **nunca** devolve líder fixo); registrar tudo em `src/app.ts` (cabeçalhos, CSRF, limites, `requireAuth` em `/api/v1/**` exceto `/auth/login`, `/auth/callback`, `/auth/backchannel-logout` e `/health*`)
- [X] T015 [US2] Atualizar testes de integração existentes (`*.routes.integration.test.ts`) para entrarem com sessão de teste; novo teste: sem sessão → 401 em cada módulo; `/health` segue aberto

### A5. Tela

- [X] T016 [P] [US1] `frontend/react/src/lib/api.ts`: enviar `X-Requested-With: bonsai`; em 401, voltar a `/login` guardando a tela de origem; teste em `api.test.ts`
- [X] T017 [US1] Trocar o login simulado: remover `features/auth/auth-service.ts` e o `localStorage`; `AuthProvider` usa `GET /api/v1/auth/me`; `LoginForm` vira o botão **Continuar** (envia o e-mail como `login_hint`) que redireciona a `/api/v1/auth/login?returnTo=…`; remover "Entrar com Google" (volta quando houver Google no Keycloak); `Sair` chama `POST /auth/logout`; atualizar testes e `RequireAuth`
- [X] T018 [P] `frontend/react/vite.config.ts`: mesmos cabeçalhos de segurança no servidor de desenvolvimento, e repasse de `/api` já existente

### A6. Verificação da etapa

- [X] T019 Rodar no container: type-check, lint, todos os testes e `npm audit` (back e tela). Tela: 0 falhas. API: 3 avisos que **já existiam** (ferramentas do Prisma e leitor de .docx), nenhum nas bibliotecas novas; fica como pendência separada
- [X] T020 **(pessoa)** Criar no Keycloak (`bonsai` → Users) uma líder de teste e um administrador de teste, com papel, senha temporária e *Required actions* (Configure OTP, Update Password)
- [X] T021 Conferência real: entrar com senha + autenticador, abrir uma tela, sair; `curl` na API sem cookie (401) e com cookie sem o cabeçalho de CSRF (recusado); cookie com `HttpOnly`/`SameSite`; confirmar nos logs que não há segredos

**Checkpoint**: entrada real e API trancada. **Etapa A concluída em 2026-10-11** (login real conferido; T023 adiantada da etapa B). Pedir aprovação antes da Etapa B.

## Etapa B — Cada líder vê só o seu (US3)

- [X] T022 [US3] Teste e `shared/security/require-role.ts` (`lider`, `administrador`; 403 sem o papel) e papéis lidos do token no login e na renovação
- [X] T023 [US3] Teste e ligação líder ↔ usuário: no primeiro login com papel `lider`, **adotar a líder fixa** se ainda sem vínculo (uma única vez, numa transação); demais líderes ganham linha nova; guardar `keycloak_subject`; `administrador` sem `lider` não recebe linha de líder
- [X] T024 [US3] Teste e `shared/security/authorization.ts`: `canViewDirectReport` e `canViewSession` comparam `leaderId`; registro de outra líder responde **404**
- [X] T025 [US3] Auditar **todos** os repositórios e services (`direct-reports`, `responsibility-maps`, `sessions`, `analyses`, `agreements`, `timeline`, resumo da Home) para sempre filtrar por `leaderId`; `requireRole('lider')` nas rotas de conteúdo
- [X] T026 [US3] Testes de integração com **duas líderes** em cada rota (listar, abrir por id, criar, editar, excluir, upload, análise, combinados, linha do tempo): nada vaza, nem por id direto
- [X] T027 [US3] Tela: esconder o que o papel não permite (o servidor continua decidindo); mensagem simples para 403
- [ ] T028 Verificar a etapa: type-check, lint, testes, `npm audit`; conferência real. Feito: tipos, lint, 159 testes unitários + 94 de integração (API), 76 (tela), sabotagem confirmando que os testes pegam falhas. Falta: conferência na tela real pela líder (dados antigos continuam aparecendo)

**Checkpoint**: pedir aprovação antes da Etapa C.

## Etapa C — Administrador convida e gerencia (US4)

- [ ] T029 Keycloak: cliente de serviço `bonsai-admin-api` (confidencial, só contas de serviço) com o mínimo de permissões no reino `bonsai`; documentar; **(pessoa)** colocar o segredo no `.env`; atualizar `.env.example` e `env.ts`
- [ ] T030 Teste e `modules/users/` (`keycloak-admin.client.ts`, service, rotas, `requireRole('administrador')`): listar, convidar (cria usuário com e-mail, papel, **senha temporária de uso único gerada no servidor**, validade de 72 h, *Required actions* de OTP e troca de senha; devolve a senha **uma única vez** e nunca a registra em log), desativar e reativar (encerra as sessões da pessoa); e-mail duplicado avisa; o **último administrador** não pode ser desativado nem perder o papel
- [ ] T031 Teste e tela "Usuários" (`features/users/`, `app/UsersPage.tsx`, item de menu só para administrador): tabela, botão Convidar (nome, e-mail, papel), caixa que mostra a senha temporária uma vez com botão Copiar, Desativar/Reativar com confirmação; seguir `frontend/BRAND.md`
- [ ] T032 Garantir que administrador **sem** papel de líder recebe 403 em qualquer rota de conteúdo (teste de integração) e que líder recebe 403 em `/users`
- [ ] T033 Verificar a etapa: type-check, lint, testes, `npm audit`; conferência real do primeiro acesso de uma pessoa convidada

**Checkpoint**: pedir aprovação antes da Etapa D.

## Etapa D — Recuperação e marca (US5)

- [ ] T034 Teste e `POST /users/:id/reset-access` (administrador): nova senha temporária de uso único, remove o autenticador antigo e exige novo cadastro; botão "Recuperar acesso" na tela de Usuários
- [X] T035 Tema do Keycloak com a marca Bonsai (cores e fontes de `tokens.css`, logo vertical, frase da marca, textos em português) em `infrastructure/keycloak/theme/`, aplicado ao reino; mostrar também as telas de erro e de configuração do autenticador Feito na spec 007 (tema pronto e testado no Keycloak local); falta instalar no Keycloak da empresa.
- [X] T036 Mensagens de erro do Keycloak em português simples (credenciais inválidas sem dizer qual falhou, conta bloqueada) Feito na spec 007 (tema pronto e testado no Keycloak local); falta instalar no Keycloak da empresa.
- [ ] T037 Atualizar `README.md`, `infrastructure/keycloak/README.md`, `backend/BACKEND.md` (regras de autenticação e autorização) e `frontend/FRONTEND.MD`; lacuna "autenticação" removida do `AGENTS.md`
- [ ] T038 Verificação final: type-check, lint, todos os testes, `npm audit`, subir do zero com `docker compose up -d --build --wait`; conferência ponta a ponta (convidar → primeiro acesso → usar → sair → desativar)

## Dependências

T001 → T002 → T003; T004 em paralelo; T005 → T011; T006–T010 em paralelo; T012 → T013 → T014 → T015; T016–T018 após T013; T019–T021 por último na etapa A. B depende de A; C depende de B; D depende de C.
