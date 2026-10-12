# Tasks: Configurações do perfil

## Backend

- [X] T001 Migration + modelo `LeaderSettings` (`leader_settings`) em `prisma/schema.prisma`
- [X] T002 `shared/ai/models.ts` (lista de modelos) e `makeAnthropicClient({apiKey, model})`; mensagem de "não configurado" em português simples
- [X] T003 [P] Testes do service de configurações (chave cifrada e nunca devolvida, chave recusada não grava, modelo fora da lista, prompt mínimo/máximo, voltar ao padrão)
- [X] T004 Módulo `settings` (schemas, repository, service, rotas) e registro no `app.ts`
- [X] T005 `resolveAiConfig(leaderId)`/prompt resolvido por líder; ligar em análise e sugestão de títulos
- [X] T006 [P] Testes de integração: rotas, isolamento entre líderes, chave nunca em resposta/log, análise usa a configuração da líder

## Tela

- [X] T007 `features/settings` (tipos, hooks, blocos Chave, Modelo, Prompt) + testes
- [X] T008 `app/SettingsPage.tsx`, rota `/configuracoes` e item no menu

## Fecho

- [X] T009 Lint, tipos, todos os testes (API e tela), `sync-templates`, README, verificação no navegador
