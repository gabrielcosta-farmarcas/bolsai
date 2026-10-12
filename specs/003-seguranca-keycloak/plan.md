# Implementation Plan: Segurança — login de verdade e permissões (Keycloak)

**Spec**: [spec.md](spec.md) · **Date**: 2026-10-11

## Summary

O Bonsai passa a entrar pelo Keycloak (reino `bonsai`, já criado), com e-mail + senha + autenticador. Quem conversa com o Keycloak é o **servidor do Bonsai**, não o navegador: o navegador só recebe um cookie de sessão que o JavaScript não consegue ler. A API passa a exigir essa sessão em tudo, a decidir por papel (líder/administrador) e a mostrar a cada líder só o que é dele. Entrega em 4 etapas, cada uma testável sozinha.

## Escolha principal (e por quê)

**Servidor guarda a sessão ("BFF"), em vez de o navegador guardar o token.**
Se algum dia houver uma falha de script na tela (XSS), um token guardado no navegador pode ser roubado e usado de qualquer lugar. Com a sessão no servidor, o navegador só tem um cookie `HttpOnly`, `SameSite` e protegido contra CSRF; o token do Keycloak nunca chega à tela. É o padrão recomendado hoje para apps de página única que lidam com dados sensíveis, como as conversas de gestão de pessoas.

Consequência para o spec (**preciso da sua aprovação**): a senha e o código do autenticador são digitados **na página de login do Keycloak**, não na tela `/login` do Bonsai. Receber a senha na nossa tela exigiria o "login direto por senha", que o Keycloak e o mercado desaconselham (a senha passaria pelo nosso código e o autenticador ficaria frágil). A tela `/login` do Bonsai continua sendo a entrada (logo, frase, botão Continuar, aviso de termos) e leva ao Keycloak, que será **vestido com a marca Bonsai** (tema do Keycloak, na etapa D). O campo de e-mail do mockup vira dica enviada ao Keycloak (`login_hint`), então a pessoa não digita duas vezes.

## Technical Context

- **Back**: Node 22 + TypeScript + Express 5 + Prisma + Zod (já existentes). Novas dependências: `openid-client` (login OIDC certificado), `helmet` (cabeçalhos), `express-rate-limit`.
- **Front**: React + Vite (já existentes). **Nenhuma** biblioteca de token no navegador; o login simulado (`localStorage`) é removido.
- **Keycloak**: `https://auth.coolify.radar.farmarcas.com.br`, reino `bonsai`. Cliente `bonsai-web` passa a **confidencial** (com segredo), fluxo "authorization code" + PKCE, sem fluxos legados.
- **Banco**: migration nova (Regra IV): `auth_sessions` e `leaders.keycloak_subject`.
- **Segredos**: só no `.env` (nunca no git): `KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `SESSION_ENCRYPTION_KEY`, `APP_BASE_URL`.
- **Docker**: o serviço `api` passa a receber essas variáveis; o `web` continua repassando `/api` à API (mesma origem, sem CORS).

## Constitution Check

- Spec Kit (I): seguido. Docker (II): sem serviço novo; só variáveis. Stack padrão (III): sem troca. Migration (IV): tabelas novas por migration. Dados locais (V): nada apagado; dados existentes viram da primeira líder. Linguagem simples (VI) e decisões técnicas do agente (VIII): sim, com a única pergunta de negócio abaixo.
- Sem violações.

## Decisões técnicas

### Autenticação
1. **Login**: `GET /api/v1/auth/login` gera `state`, `nonce` e PKCE, guarda em cookie curto e redireciona ao Keycloak. `GET /api/v1/auth/callback` troca o código, valida assinatura/emissor/público/`nonce`/validade do token e cria a sessão.
2. **Sessão no servidor**: tabela `auth_sessions` (id = hash SHA-256 de um valor aleatório de 256 bits; `leader_id`/`subject`; papéis; `sid` do Keycloak; *refresh token cifrado* com AES-256-GCM e a chave do `.env`; criado em, último uso, expira em). Cookie `bonsai_sid`: `HttpOnly`, `SameSite=Lax`, `Secure` fora do desenvolvimento, `Path=/`. Id de sessão **novo a cada login** (anti-fixação).
3. **Validade**: 30 min parada e 10 h no máximo, iguais às do Keycloak. A cada ~5 min o servidor renova com o Keycloak; se o usuário foi desativado ou a sessão foi encerrada lá, a sessão do Bonsai cai.
4. **Logout**: `POST /api/v1/auth/logout` apaga a sessão e encerra no Keycloak (`end_session` com `id_token_hint`). **Back-channel logout**: o Keycloak avisa o servidor, que apaga as sessões daquele `sid` (sair em um lugar sai em todos).
5. **Segundo fator**: o fluxo de login do reino é ajustado para o código do autenticador ser **obrigatório sempre** (hoje é condicional), não só para quem já configurou.
6. **Sem senha no código do Bonsai**: nem a tela nem a API veem senha ou código do autenticador.

### Autorização (permissões)
7. **`requireAuth`** em todas as rotas `/api/v1/**`, exceto `/auth/login`, `/auth/callback`, `/health` e `/health/ready`. Sem sessão: **401**.
8. **Papéis** vêm do token na hora do login/renovação: `lider` e `administrador`. `requireRole('lider')` protege pessoas, encontros, análises e combinados; `requireRole('administrador')` protege a gestão de usuários. Administrador sem papel de líder **não** alcança conteúdo de 1:1 (**403**).
9. **Usuário atual sem mudar quem chama**: um middleware guarda o usuário da requisição em `AsyncLocalStorage`; `getCurrentUser()` (já usado por todos os controllers) passa a lê-lo. Falta de usuário lança erro (nunca devolve "líder fixo").
10. **Isolamento por líder**: `canViewDirectReport` e `canViewSession` passam a comparar `leaderId` do registro com o do usuário; **todas** as consultas dos repositórios filtram por `leaderId`; registro de outra líder responde **404** (sem confirmar que existe). Teste de integração com duas líderes em cada rota.
11. **Ligação com os dados atuais**: `leaders.keycloak_subject` (único). No primeiro login de uma líder, se ainda existir a líder fixa sem vínculo, ela é **adotada** (num único passo, uma vez só); as demais líderes ganham uma linha nova.
12. **Admin de usuários (etapa C)**: cliente de serviço próprio no Keycloak, com o mínimo de permissões (gerenciar usuários do reino `bonsai`), segredo só no `.env`.

### Defesas do servidor e da tela
13. **Cabeçalhos** (`helmet`): CSP restritiva (`default-src 'self'`, sem scripts de fora), `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: no-referrer`, HSTS fora do desenvolvimento. O Vite do desenvolvimento envia os mesmos cabeçalhos.
14. **CSRF**: cookie `SameSite=Lax` + toda escrita (`POST/PUT/PATCH/DELETE`) exige o cabeçalho `X-Requested-With: bonsai` e `Origin` igual ao do app. Sem CORS (mesma origem).
15. **Limite de tentativas**: `express-rate-limit` forte em `/auth/*` e geral na API; o Keycloak ainda bloqueia a conta após 5 erros.
16. **Entrada de dados**: Zod em todas as rotas (já existe); corpo com limite de tamanho; upload só nos tipos já aceitos.
17. **Logs**: o filtro atual de campos sensíveis ganha `authorization`, `cookie`, `set-cookie`, `code`, `state`, tokens e e-mail em erros; teste prova que não vazam.
18. **Erros**: mensagens iguais para "usuário inexistente" e "senha errada" (o Keycloak já faz); API não revela se um id existe.
19. **Tela**: `AuthProvider` pergunta `GET /api/v1/auth/me`; "Continuar" faz redirecionamento completo para `/api/v1/auth/login`; `apiFetch` manda o cabeçalho de CSRF e, ao receber 401, volta ao `/login`; menu e botões do administrador só aparecem para quem tem o papel (e a API confere de novo). Nada de token ou papel em `localStorage`.
20. **Dependências**: `npm audit` sem falhas altas/críticas antes de fechar cada etapa.

## Etapas (cada uma entra no ar sozinha)

- **A — Entrar de verdade e trancar a API** (US1, US2): ajustes no Keycloak (cliente confidencial, fluxo com OTP obrigatório, logout), rotas `/auth/*`, sessão, `requireAuth`, cabeçalhos, CSRF, rate limit, tela `/login` e botão Sair ligados.
- **B — Cada líder vê só o seu** (US3): papéis, `keycloak_subject`, adoção da líder fixa, `canView*` reais, filtros nos repositórios, testes com duas líderes.
- **C — Administrador** (US4): cliente de serviço, tela "Usuários" (convidar, listar, desativar/reativar), papel `administrador` sem acesso a 1:1.
- **D — Recuperação e marca** (US5): redefinição pelo administrador e tema Bonsai no Keycloak.

## Project Structure

```text
specs/003-seguranca-keycloak/   spec.md · plan.md · tasks.md (etapa 3)

backend/node/
├── prisma/migrations/…_auth_sessions/      # auth_sessions + leaders.keycloak_subject
└── src/
    ├── config/env.ts                       # variáveis do Keycloak e da sessão (Zod)
    ├── shared/security/
    │   ├── current-user.ts                 # lê AsyncLocalStorage
    │   ├── authorization.ts                # compara leaderId
    │   ├── session-crypto.ts               # AES-256-GCM do refresh token
    │   ├── csrf.ts · rate-limit.ts · security-headers.ts
    │   └── require-auth.ts · require-role.ts
    └── modules/auth/                       # routes · controller · service · oidc-client · session.repository

frontend/react/
├── vite.config.ts                          # cabeçalhos de segurança no dev
└── src/
    ├── lib/api.ts                          # CSRF + 401 → /login
    ├── features/auth/                      # AuthProvider usa /auth/me; sem localStorage
    └── app/LoginPage.tsx                   # Continuar → /api/v1/auth/login

infrastructure/keycloak/README.md           # atualizado a cada ajuste no reino
```

## Testes

- **API (Vitest + Supertest)**: sem sessão → 401; sessão expirada → 401; papel errado → 403; duas líderes sem vazamento em todas as rotas; CSRF recusa escrita sem cabeçalho; cookie com os atributos certos; callback recusa `state`/`nonce` inválidos; logs sem segredos. Servidor OIDC falso nos testes (sem depender do Keycloak real).
- **Tela (Vitest)**: guarda de rota, 401 volta ao login, botões por papel.
- **Conferência real**: criar um usuário de teste no Keycloak (feito por uma pessoa), entrar com senha + autenticador, abrir uma tela, sair, tentar a API sem cookie com `curl`.

## Riscos e pontos de atenção

- **Keycloak compartilhado da empresa**: toda mudança fica só no reino `bonsai`.
- **Dados reais continuam fora de uso** até criptografia dos dados, auditoria e LGPD (Fase 3 restante). Esta etapa fecha a *porta*, não o *cofre*.
- **Produção** (HTTPS, domínio, endereços no cliente) fica para quando houver ambiente; o código já respeita `Secure`/HSTS por `NODE_ENV`.

## Decisões de negócio (aprovadas em 2026-10-11)

1. Senha e código do autenticador são digitados na página do Keycloak (com a marca Bonsai), não na tela `/login`. **Aprovado.**
2. Convite sem e-mail: o administrador recebe uma **senha temporária de uso único** (válida 72 h) para repassar; no primeiro acesso o Keycloak obriga a trocar a senha e configurar o autenticador. **Aprovado** (não há servidor de e-mail).
