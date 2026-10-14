# Tarefas: Comportamentos desejados no responsograma

## Banco
- [x] T001 `behaviors` (texto, anulável) em `ResponsibilityMap` no `schema.prisma` + migration Prisma que só adiciona a coluna (sem backfill)

## Backend
- [x] T002 `map-text.ts`: seção "COMPORTAMENTOS DESEJADOS" no texto composto da versão, só quando preenchida + teste
- [x] T003 Schemas Zod (`responsibility-maps` e `direct-reports`): `behaviors` opcional, máximo 3.000 caracteres
- [x] T004 Service e repository de `responsibility-maps`: gravar e devolver `behaviors` (aparado; vazio vira `null`); editar só os comportamentos gera nova versão sem mexer nas responsabilidades + testes unitários
- [x] T005 Service e repository de `direct-reports`: cadastro grava `behaviors` na versão 1 + teste
- [x] T006 Controller: repassar `behaviors` no cadastro e na nova versão
- [x] T007 `analysis-input.ts` e `analyses.service.ts`: bloco `<comportamentos_desejados>` após `</responsabilidades>`, só quando há texto + testes (com e sem comportamentos)
- [x] T008 Teste de integração HTTP: cadastro e nova versão com `behaviors`, acima do limite devolve erro de validação, versão antiga mantém o texto dela

## Prompt
- [x] T009 `prompts/analysis-1on1.md`: 2 linhas curtas sobre os comportamentos (régua de leitura, sem nota nem rótulo, só com trecho da conversa); arquivar a versão atual em `prompts/arquivo/` e anotar no `LEIAME.md`
- [x] T010 Texto final do prompt entregue à pessoa para colar em Configurações (ver a conversa)

## Frontend
- [x] T011 Tipos e hook `useResponsibilityMaps`: `behaviors` no envio e na leitura
- [x] T012 `DirectReportForm`: campo "Comportamentos desejados (opcional)" depois das responsabilidades, com contador e aviso de limite + teste
- [x] T013 `ResponsibilityMapSection`: campo na edição e exibição dos comportamentos em cada versão (versão sem texto não mostra a seção) + teste

## Fechamento
- [x] T014 Testes, lint e tipos passando (API: 264 + 119 de integração; tela: 140). Conferência no navegador e análise real: pendentes, pedem o login da pessoa (Keycloak)
