# Tarefas: Anotações sobre pessoas

Ordem: Base → US1 (anotar) → US2 (plano) → US3 (combinado e encontro) → Fechamento. Cada história pode ser testada sozinha. MVP = Base + US1.

## Base (bloqueia todas as histórias)
- [x] T001 `schema.prisma` (`backend/node/prisma/`): enum `NoteKind` (`agreement_missed`, `attention`, `praise`, `@@map("note_kind")`); modelos `Note` (`notes`) e `NoteStep` (`note_steps`) conforme `data-model.md`, reaproveitando `AgreementOwner`; relações em `Leader`, `DirectReport` e `Agreement`
- [x] T002 Migration Prisma `<data>_notes` que só adiciona tipo e tabelas; índice parcial `(direct_report_id, noted_at desc) where deleted_at is null` e `(note_id, position)` no SQL; aplicar no Postgres local sem apagar dados
- [x] T003 `authorization.ts` (`backend/node/src/shared/security/`): `canViewNote` igual aos demais (só a líder dona) + teste
- [x] T004 [P] Esqueleto do módulo `backend/node/src/modules/notes/`: `notes.schemas.ts` (Zod: `kind` nos 3 valores; `description` 1 a 2.000 após trim; `text` do passo 1 a 500; `notedAt`/`dueDate` AAAA-MM-DD; `owner` leader|report padrão leader), `notes.routes.ts` registrada em `app.ts`
- [x] T005 [P] Função pura `computeNoteStatus` (resolved → in_progress → no_plan) e `isStepOverdue` + testes unitários em `notes.status.test.ts`

## US1 — Anotar o que aconteceu (P1)
**Teste independente**: criar, editar, excluir e filtrar anotações de uma pessoa; outra líder recebe 404.
- [x] T006 [US1] `notes.repository.ts`: listar da pessoa (mais recente primeiro, filtro por situação, contagens `all/no_plan/in_progress/resolved`), criar, buscar por id, editar, excluir (`deleted_at`); sempre filtrando por `leader_id` e pessoa não excluída
- [x] T007 [US1] `notes.service.ts` + `notes.controller.ts`: `GET/POST /direct-reports/:id/notes`, `PATCH/DELETE /notes/:id`; `notedAt` padrão hoje (São Paulo); erros `NOTE_NOT_FOUND` e `DIRECT_REPORT_NOT_FOUND`; testes unitários do service
- [x] T008 [US1] Teste de integração HTTP (`notes.routes.integration.test.ts`): criar, listar com filtro e contagens, editar, excluir, descrição vazia e acima do limite, e isolamento (outro líder recebe 404; incluir em `isolation.integration.test.ts`)
- [x] T009 [P] [US1] Frontend `features/notes/`: `types.ts`, `index.ts`, hooks `useNotes` e mutações (criar, editar, excluir) com TanStack Query, no padrão de `features/agreements`
- [x] T010 [P] [US1] Componentes `NoteForm` (tipo, data, descrição com aviso de limite), `NoteFilters` (Todas / Sem plano / Em andamento / Resolvidas com contagem), `NoteList` e `NoteItem` (etiquetas pela marca: `accent-subtle` para o tipo; `warning-subtle` com `text` para a situação) + testes; estado vazio como convite
- [x] T011 [US1] `DirectReportPage.tsx`: aba "Anotações" (`aba=anotacoes` em `VALID_TABS`) ao lado de Encontros e Combinados, com contagem; confirmação ao excluir (`ConfirmDialog`)

## US2 — Plano de ação (P1)
**Teste independente**: adicionar 3 passos, marcar 1 feito, ver "1 de 3 feitos" e "Em andamento"; resolver e reabrir.
- [x] T012 [US2] Repository e service: adicionar, editar, marcar feito (`done_at`), remover passo; `position` sequencial; devolver `Note` com `steps`, `progress` e `status` calculado; `PATCH /notes/:id` com `resolved` (grava/limpa `resolved_at`, zera `bring_to_next_session` ao resolver); testes unitários das transições (primeiro passo, remover o último, resolver, reabrir)
- [x] T013 [US2] Rotas `POST /notes/:id/steps`, `PATCH` e `DELETE /notes/:id/steps/:stepId` + controller; erro `STEP_NOT_FOUND`; teste de integração dos passos, do progresso e do atraso
- [x] T014 [P] [US2] Hooks de passos e `PlanSteps.tsx`: lista com caixa de marcar, texto, prazo, responsável, "N de M feitos", prazo vencido em tom de atenção (sem vermelho de alarme), adicionar/editar/remover passo + testes
- [x] T015 [US2] `NoteItem`: expandir/recolher com o plano, botão "Marcar como resolvida" / "Reabrir", sugestão de resolver quando todos os passos estão feitos (não resolve sozinho) + teste

## US3 — Virar combinado e levar ao encontro (P2)
**Teste independente**: promover um passo e ver o Combinado na pessoa (sem duplicar); marcar a anotação e vê-la na aba Preparar 1:1 até resolver.
- [x] T016 [US3] Service de notas: `POST /notes/:id/steps/:stepId/agreement` cria Combinado pelo repositório de Combinados (texto, prazo e responsável do passo; `origin: leader`, confirmado) e grava `agreement_id`; repetir devolve o existente, sem criar outro; teste unitário e de integração (Combinado aparece em `/direct-reports/:id/agreements`)
- [x] T017 [US3] `PATCH /notes/:id` com `bringToNextSession` e `GET /direct-reports/:id/notes/for-next-session` (marcadas e não resolvidas) + testes
- [x] T018 [P] [US3] Frontend: botão "Virar combinado" no passo (etiqueta "Combinado" depois), botão "Levar para o próximo encontro"; invalidar a lista de Combinados ao promover + testes
- [x] T019 [US3] `features/preparation/` e aba "Preparar 1:1": bloco "Anotações levadas ao encontro" com descrição e passos em aberto, lido de `for-next-session`; some ao resolver + teste

## Fechamento
- [x] T020 Textos da tela revisados no tom do Bonsai (sem "cobrança", "desempenho", "nota", "monitorar") e cores só por tokens (`frontend/BRAND.md`)
- [x] T021 Testes, lint e tipos passando na API e na tela; rodar `scripts/validar-frontend.sh`
- [x] T022 Roteiro de `quickstart.md` no ambiente local (`docker compose up -d --build --wait`), conferência visual no navegador e informar a URL
