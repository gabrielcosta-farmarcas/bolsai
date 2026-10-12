---
description: "Task list for Tela de login (somente front)"
---

# Tasks: Tela de login (somente front)

**Input**: `specs/002-tela-de-login/` (spec.md, plan.md)

**Tests**: Incluídos (Vitest + Testing Library; teste antes do código de cada parte).

**Format**: `- [ ] T### [P?] [US?] Descrição com caminho do arquivo` — `[P]` = pode andar em paralelo.

**Paths**: tudo em `frontend/react/src/`. Ler antes: `frontend/BRAND.md`, skills `component-development` e `styling-tailwind`. Comandos rodam no container `web`.

## Phase 1: Base (serviço de login simulado)

- [X] T001 Teste e implementação de `features/auth/auth-service.ts` e `types.ts`: `getSession`, `signIn(email)`, `signInWithGoogle()`, `signOut()` em `localStorage` (chave `bonsai-auth`, com `try/catch`), + `auth-service.test.ts`
- [X] T002 `features/auth/hooks/useAuth.tsx`: `AuthProvider` e `useAuth()` sobre o serviço (T001)

**Checkpoint**: serviço e contexto prontos; pedir aprovação antes da Fase 2.

## Phase 2: User Story 1 + 3 — Entrar com e-mail, com erros claros (P1/P2)

**Independent test**: abrir `/login`, tentar vazio e e-mail inválido, entrar com e-mail válido e chegar à tela inicial.

- [X] T003 [US1] Teste e implementação de `features/auth/components/LoginForm.tsx` (campo "E-mail de trabalho", Continuar, validação e mensagens do spec, espaços removidos, Enter envia) + `LoginForm.test.tsx`
- [X] T004 [US1] `app/LoginPage.tsx`: página cheia, centralizada, card `rounded-xl` com `<Logo variant="vertical" size="login" />`, frase da marca, `LoginForm`, divisor "ou" e aviso de Termos/Privacidade (links sem destino); se já entrou, vai a `/`; depois de entrar, volta ao endereço de origem

## Phase 3: User Story 2 — Entrar com Google (P2)

- [X] T005 [US2] Botão "Entrar com Google" (variante `secondary`) no `LoginForm`, chamando `signInWithGoogle()`; teste em `LoginForm.test.tsx`

## Phase 4: Bloqueio das telas e Sair (P1/P2)

- [X] T006 Teste e implementação de `features/auth/components/RequireAuth.tsx` (sem sessão → `/login` com `state.from`) + `RequireAuth.test.tsx`
- [X] T007 [US4] `app/App.tsx`: `AuthProvider`, rota `/login` fora do `AppShell`, demais rotas dentro de `RequireAuth`
- [X] T008 [US4] Botão **Sair** (`ghost`, `sm`) em `components/layout/AppShell.tsx`, ao lado do `ThemeToggle`; ao clicar, `signOut()` e vai a `/login`
- [X] T009 [P] `features/auth/index.ts` exportando o que as páginas usam

## Phase 5: Acabamento e verificação

- [X] T010 Rodar no container `web`: type-check, lint e todos os testes verdes
- [X] T011 Conferir no navegador (`http://localhost:3000`): `/login` igual ao mockup em claro e escuro, celular (375 px), só pelo teclado, redirecionamento, voltar à tela pedida, Sair
- [X] T012 Corrigir o que a conferência achar e avisar o resultado em linguagem simples

## Dependências

T001 → T002 → T003 → T004 → T005; T006 depende de T002; T007 depende de T004 e T006; T008 depende de T002 e T007; T010–T012 por último.
