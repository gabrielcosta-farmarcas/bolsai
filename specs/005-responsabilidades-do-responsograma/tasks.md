---
description: "Task list for Responsabilidades do responsograma na evolução"
---

# Tasks: Responsabilidades do responsograma na evolução

**Input**: `specs/005-responsabilidades-do-responsograma/` (spec.md, plan.md)

**Tests**: Incluídos. Em cada tarefa, o teste vem antes do código (TDD): back com Vitest (+ Supertest nas rotas), tela com Vitest + Testing Library.

**Format**: `- [ ] T### [P?] [US?] Descrição com caminho do arquivo` — `[P]` = pode andar em paralelo.

**Paths**: API em `backend/node/`, tela em `frontend/react/`. Ler antes: `backend/BACKEND.md` + skills `node-api-development` e `node-unit-testing` (API), `database/DATABASE.md` + `migrations` (banco), `frontend/BRAND.md` + `component-development` + `styling-tailwind` (tela). Comandos rodam nos containers. Aprovação ao fim de cada etapa (A–C).

**Segurança em tudo**: toda consulta com `leaderId`; criar algo ligado a uma pessoa passa por `assertOwnsReport`; rotas novas entram no teste de isolamento de duas líderes (`src/isolation.integration.test.ts`); nenhum texto de responsabilidade ou observação vai para o log.

## Etapa A — Cadastro por campos e responsabilidades como registro (US1)

### A1. Núcleo (puro, testado primeiro)

- [X] T001 [P] Teste e `src/modules/responsibilities/normalize.ts`: normalizar texto (aparar, colapsar espaços, minúsculas) para a chave; título provisório (começo da frase, até 60 caracteres, cortado em palavra, sem reticências quebradas)
- [X] T002 [P] Teste e `src/modules/responsibilities/responsibilities.schemas.ts` (Zod): lista de 3 a 10 textos, cada um de 3 a 1.000 caracteres aparados; repetidos (pela chave) viram um só e geram aviso; mensagens em português ("Preencha pelo menos 3 responsabilidades", dizendo quantas faltam)
- [X] T003 Teste e `src/modules/responsibilities/reconcile.ts` (função pura): dado o que existe (ativas e aposentadas) e a lista nova, devolve o que manter (com nova posição), criar, aposentar e reativar. Casos: igual com maiúsculas/espaços diferentes, mudou de posição, texto editado vira nova, removida aposenta, volta a ser igual reativa, repetidos

### A2. Banco

- [X] T004 Teste e migration `responsibilities` em `backend/node/prisma/` (id UUIDv7, `leader_id`, `direct_report_id`, `position`, `text`, `title`, `title_source`, `key`, `retired_at`, datas; único `(direct_report_id, key)`; índices por pessoa e por líder) + modelo no `schema.prisma` + relação com `Leader` e `DirectReport`; aplicar também no banco de teste; conferir sem diferença com `prisma migrate diff`

### A3. API

- [X] T005 Teste e `responsibilities.repository.ts`: listar ativas/aposentadas, aplicar o resultado da reconciliação numa transação, atualizar título; **toda consulta com `leaderId`** e criação via `assertOwnsReport`
- [X] T006 Teste e `responsibilities.service.ts`: salvar versão (valida 3–10, reconcilia, grava a versão do responsograma com o texto composto e a missão, devolve títulos provisórios na hora); listar; editar título (`title_source='leader'`); 404 para pessoa de outra líder
- [X] T007 Teste e `titles.ts` (segundo plano): pedir títulos à IA só para itens novos com `title_source='fallback'`, gravar `ai` sem sobrescrever o que a líder editou; sem IA configurada ou com erro, não muda nada e não derruba o salvar; nunca registra texto no log
- [X] T008 Teste e rotas `GET /direct-reports/:id/responsibilities` (`?retired=true`), `PATCH /responsibilities/:id`, e as mudanças em `POST /direct-reports` (campo `responsibilities: string[]`, 3–10; `mission?` à parte) e `POST /direct-reports/:id/responsibility-maps` (JSON com a lista); registrar em `src/app.ts`
- [X] T009 Teste e `POST /responsibility-maps/extract` (sem id de pessoa, para servir também no cadastro; só lê o arquivo enviado e não toca em dado guardado) (arquivo PDF/Word/texto): lê, separa em parágrafos e **devolve a proposta** (`mission?`, `responsibilities`, `leftOut`) **sem salvar nada e sem guardar o arquivo**; tipos e tamanho já aceitos hoje
- [X] T010 Retirar do responsograma o arquivo original: remover rota `GET /responsibility-maps/:id/file`, o uso de `fileBytes`/`hasFile` e atualizar os testes que dependiam disso (a coluna fica sem uso)
- [X] T011 Ampliar `src/isolation.integration.test.ts` com as rotas novas (listar, editar título, extrair, criar versão) e a barreira do banco; administrador/liderado recebem 403

### A4. Tela

- [X] T012 [P] Teste e `features/responsibilities/components/ResponsibilityFields.tsx`: 10 campos "Responsabilidade 1…10", contador "N preenchidas (mínimo 3)", aviso de repetido, mensagem de erro clara, acessível (rótulos, `aria-describedby`)
- [X] T013 Teste e botão **Preencher a partir de um arquivo** (chama `extract`, preenche os campos, mostra o que ficou de fora)
- [X] T014 Trocar o campo único de responsabilidades por `ResponsibilityFields` em `DirectReportForm.tsx` (nova pessoa; mínimo 3 obrigatório) e em `ResponsibilityMapSection.tsx` (nova versão, pré-preenchida com as ativas); atualizar `lib/types`, hooks e testes existentes
- [X] T015 [P] Teste e edição inline do título (lápis ao lado do título; salvar com Enter; Esc cancela) usando `PATCH /responsibilities/:id`

### A5. Verificação da etapa

- [X] T016 Rodar nos containers: type-check, lint, todos os testes (unitários, integração, tela), `npm audit`; `scripts/sync-templates.sh`
- [ ] T017 Conferência real no navegador **(pessoa)**: cadastrar uma pessoa com 4 responsabilidades (fictícias), tentar com 2 (recusa), preencher por arquivo, ver os títulos provisórios virarem títulos da IA (se houver chave), editar um título; claro, escuro e celular

**Checkpoint**: responsabilidades existem como registro (testes verdes: 203 + 104 na API, 108 na tela). Falta só a conferência real (T017). Pedir aprovação antes da Etapa B.

## Etapa B — Análise por responsabilidade (US2)

- [X] T018 [P] Teste e `analysis-input.ts`: bloco `<missao>` e bloco `<responsabilidades>` com **todas** as ativas, numeradas `R1: …`, em ordem, sem cortar nada; teste que confere que cada texto preenchido aparece no que vai à IA (SC-002a); recusa com mensagem clara se houver menos de 3 ou mais de 10
- [X] T019 [P] Teste e `analysis.schema.ts`: `development_signals` da IA com `responsibility_ref` (`R1…Rn` ou `FORA`); formato salvo/revisado com `responsibility_id` (uuid ou nulo); remover o nome livre
- [X] T020 Teste e validação em `evaluation.ts`: referência que não está na lista enviada é inválida e dispara a nova tentativa automática; `FORA` aceito; até 5 sinais
- [X] T021 Teste e conversão no `analyses.service.ts`/`analyses.repository.ts`: depois de validar, trocar `Rn` pelo `responsibility_id` antes de gravar o JSON (o mapa `Rn → id` não precisa ser guardado: o id já fica no JSON). Migração sem perda das observações antigas (`20261012180000_legacy_signals`)
- [X] T022 Teste e conferência na revisão: ao salvar a versão final, todo `responsibility_id` deve pertencer à **mesma pessoa** (senão 422); administrador/liderado 403
- [X] T023 Escrever `prompts/analysis-1on1.v4.md` (responsabilidades numeradas, `responsibility_ref`, "só use o que está na lista, senão FORA", sem inventar); mover v1–v3 para `prompts/arquivo/`; a lista de versões mostra só a v4; atualizar `prompt-loader` e testes
- [X] T024 Avaliar o prompt v4 com o roteiro existente (`npm run evaluate`): **3 de 3 conversas aprovadas** em 2026-10-12 (caso 01: apontou R2 acessibilidade e R4 participação em decisões, como esperado; 02 e 03: só referências válidas e FORA)
- [X] T025 Teste e seletor na revisão (`features/analysis-review/components/ReviewEditor.tsx`/`ReviewPanels.tsx`): cada observação com seletor das responsabilidades (título) + "Fora das responsabilidades"; leitura (`AnalysisReadOnly`, `AnalysisCompare`) mostra o título; atualizar `types.ts`
- [ ] T026 Verificar a etapa **(pessoa na conferência real)**: type-check, lint, todos os testes, `npm audit`; conferência real analisando um 1:1 fictício e corrigindo uma responsabilidade na revisão

**Checkpoint**: análise aponta para responsabilidades; pedir aprovação antes da Etapa C.

## Etapa C — Evolução por responsabilidade (US3, US4)

- [ ] T027 Teste e `timeline.service.ts`/`timeline.repository.ts`: `responsibilities` com **todas** as ativas (com `points` por encontro e a observação de cada um, mais `neverMentioned` = sem nenhum ponto em 1:1 revisado, e só `true` se já houver ao menos um 1:1 revisado), `retired` (aposentadas com histórico) e `unassigned` ("fora"); usa a versão final revisada quando existe
- [ ] T028 Teste e rota `GET /direct-reports/:id/timeline` atualizada; ampliar o teste de isolamento
- [ ] T029 [P] [US3] Teste e `ResponsibilityEvolution.tsx`: uma fileira por responsabilidade, na ordem; título + marcador por encontro em que foi citada; fileira **em alerta** ("Ainda não conversado", sem marcadores) quando nunca citada, só havendo ao menos um 1:1 analisado e revisado
- [ ] T030a [P] [US3] Teste e **aviso no topo** da evolução: "N responsabilidades ainda não foram conversadas nos 1:1" com os títulos; some quando não há nenhuma em alerta e não aparece antes do primeiro 1:1 revisado; o servidor já devolve o campo `neverMentioned` em cada responsabilidade (T027)
- [ ] T030 [P] [US3] Teste e expansão: botão que abre a frase completa e as observações por encontro (`aria-expanded`, teclado); título editável aqui também
- [ ] T031 [US4] Teste e seções recolhidas "Fora das responsabilidades" e "Responsabilidades anteriores" (com histórico preservado); quando o responsograma muda de versão, as iguais mantêm as camadas
- [ ] T032 Atualizar `features/timeline/types.ts`, `Timeline.tsx`, `TimelineEntryCard.tsx` e testes; seguir `BRAND.md` (sem sombras, tokens, claro/escuro, celular)
- [ ] T033 Documentação: `database/DATABASE.md` (tabela nova), `backend/BACKEND.md` se necessário, `README.md`; `scripts/sync-templates.sh`; atualizar a memória do projeto
- [ ] T034 Verificação final: type-check, lint, todos os testes, `npm audit`, `docker compose up -d --build --wait`; conferência ponta a ponta (cadastrar com 4 → analisar → corrigir → ver evolução → subir nova versão do responsograma e conferir o histórico)

## Dependências

T001–T003 em paralelo → T005 depende de T003 e T004 → T006 → T007/T008 → T009/T010 → T011. T012 → T013 → T014; T015 depende de T008. T016–T017 por último na etapa A.
Etapa B depende de A: T018–T020 em paralelo → T021 → T022; T023 → T024; T025 depende de T019 e T021.
Etapa C depende de B: T027 → T028; T029–T031 em paralelo depois de T028; T032 depois; T033–T034 por último.

## Ajuste de tom (pedido do usuário, 2026-10-12)

- [X] Prompt `analysis-1on1.v5.md`: postura exigente, direta e baseada em evidência para um time de alta performance (resultado antes de esforço, combinado parado ou vencido vira ponto de atenção, feedback do líder mais franco, perguntas desafiadoras), **mantendo** as proteções: só fatos da conversa com trecho literal, sem rótulo, sem diagnóstico de personalidade ou saúde, texto profissional. Avaliada com a IA real: 3 de 3 conversas aprovadas. É a versão mais recente (padrão); a v4 continua selecionável na revisão.
