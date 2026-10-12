# Implementation Plan: Tela de login (somente front)

**Spec**: [spec.md](spec.md) · **Date**: 2026-10-11

## Summary

Adicionar a tela `/login` (mockup, claro e escuro), um login **simulado** guardado no navegador, bloqueio das demais telas para quem não entrou e botão Sair na barra superior. Só o front muda; nenhum servidor, banco ou dependência nova.

## Technical Context

- **Stack (já existente)**: React + TypeScript + Vite + Tailwind, React Router, Vitest + Testing Library. Roda no Docker (serviço `web`).
- **Armazenamento**: `localStorage` (chave `bonsai-auth`), com `try/catch` como já é feito em `lib/theme.ts`. Guarda só `{ email }` ou `{ email: 'Google' }`; nunca senha (não há senha).
- **Backend / banco**: nenhum. Sem migration, sem endpoint.
- **Identidade visual**: `frontend/BRAND.md`; tokens de `tokens.css`; logo só pelo `<Logo variant="vertical" size="login" />` (52 px); card com `rounded-xl`, borda de 1 px, sem sombra.
- **Escopo**: 1 página, 1 feature nova (`auth`), ajuste de `App.tsx` e `AppShell.tsx`.

## Constitution Check

- Spec Kit seguido (II/I): sim. Docker: continua no `web`. Stack padrão: sem novidade. Dados locais: nada apagado, sem segredo no git. Decisões técnicas tomadas pelo agente: sim (abaixo).
- Sem violações; nada em Complexity Tracking.

## Decisões técnicas

1. **Camada de entrada isolada** em `features/auth/auth-service.ts` (`getSession`, `signIn`, `signInWithGoogle`, `signOut`). As telas só falam com ela. Na Fase 3 troca-se esse arquivo pelo login real (Keycloak) sem refazer telas (FR-009).
2. **`AuthProvider` + `useAuth()`** (contexto React) expõem `session`, `signIn`, `signInWithGoogle`, `signOut`, para barra superior e rotas reagirem juntas.
3. **`RequireAuth`**: envolve as rotas internas; sem sessão, `<Navigate to="/login" state={{ from }} replace />`. Depois de entrar, volta para `from` (ou `/`).
4. **Login fora do `AppShell`**: a rota `/login` tem tela cheia própria (sem barra de navegação), centralizada. Quem já entrou e abre `/login` é enviada a `/`.
5. **Validação** local: e-mail vazio → "Informe seu e-mail de trabalho."; formato inválido (regex simples) → "Informe um e-mail válido."; espaços nas pontas são removidos. Erro via `TextField` (`errorMessage`), que já anuncia a um leitor de tela.
6. **Google**: botão `secondary` que chama `signInWithGoogle()` (simulado, sem ícone, como no mockup).
7. **Termos e Privacidade**: `<a href="#">` com `preventDefault`, estilizados como link, sem página (FR-010).
8. **Sair**: botão `ghost` pequeno na barra superior, ao lado do `ThemeToggle`; chama `signOut()` e vai a `/login`.
9. **Mobile e tema**: card com `w-full max-w-[420px]` e margem de 16 px; cores só por tokens, então o tema escuro funciona sem código extra. Botões na altura de controle (`--control-h`).
10. O mockup mostra o card com fundo mais claro que a página: página `bg-bg`, card `bg-surface`.

## Project Structure

```text
specs/002-tela-de-login/
├── spec.md
├── plan.md
└── tasks.md            (etapa 3)

frontend/react/src/
├── app/
│   ├── App.tsx                      # ajustado: AuthProvider, rota /login, RequireAuth
│   └── LoginPage.tsx                # novo: layout da página
├── components/layout/AppShell.tsx   # ajustado: botão Sair
└── features/auth/                   # novo
    ├── index.ts
    ├── types.ts
    ├── auth-service.ts              # (+ auth-service.test.ts)
    ├── hooks/useAuth.tsx            # AuthProvider + useAuth
    └── components/
        ├── LoginForm.tsx            # (+ LoginForm.test.tsx)
        └── RequireAuth.tsx          # (+ RequireAuth.test.tsx)
```

## Testes

- `auth-service`: entra, lembra, sai; storage indisponível não quebra.
- `LoginForm`: erros de e-mail vazio/inválido, envio válido, botão Google.
- `RequireAuth`: redireciona sem sessão, mostra o conteúdo com sessão.
- Conferência no navegador: claro, escuro e celular, só pelo teclado.

## Fora deste plano

Servidor, senha, páginas de Termos/Privacidade, Keycloak e Google reais (Fase 3).
