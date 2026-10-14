# Implementation Plan: Comportamentos desejados no responsograma

**Branch**: `main` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

## Summary

Novo campo opcional de texto, `behaviors` ("comportamentos desejados"), na versão do responsograma, ao lado da missão. Segue o mesmo caminho da missão em todas as camadas: coluna no banco, API de cadastro e de nova versão, tela, e bloco `<comportamentos_desejados>` na mensagem enviada à IA. O prompt padrão ganha 2 linhas explicando o uso.

## For the reader

Chosen: guardar os comportamentos junto da versão do responsograma, do mesmo jeito que a missão do cargo já é guardada.

Why: reaproveita o que já existe (cadastro, histórico de versões e envio para a análise), sem tela nova e sem risco para os dados atuais.

## Technical Context

**Language/Version**: TypeScript (Node 20 na API, React + Vite na tela), como o resto do projeto
**Primary Dependencies**: Prisma, Zod, Vitest, Tailwind (já em uso)
**Storage**: PostgreSQL 16, nova coluna anulável em `responsibility_maps` (migration)
**Testing**: Vitest (unitário do service e do montador da entrada da IA), testes de componente na tela
**Target Platform**: Docker Compose local e Coolify
**Project Type**: web (frontend + backend)
**Performance Goals**: sem impacto; até 3.000 caracteres a mais por análise
**Constraints**: campo opcional; pessoas atuais ficam com `null`; nada que já existe pode quebrar
**Scale/Scope**: 1 coluna, 1 campo na tela, 1 bloco na entrada da IA, 2 linhas no prompt

## Constitution Check

- I Spec Kit: spec, plano e tarefas antes do código. OK.
- II Docker: nada fora do Compose. OK.
- III Stack padrão: a do projeto. OK.
- IV Banco só por migration: migration Prisma que só **adiciona** coluna anulável (expand, sem tocar nos dados). OK.
- V Dados locais protegidos: nenhum comando que apague dados. OK.
- VI/VIII Linguagem simples, agente decide o técnico. OK.
- VII Começar pequeno: um campo único, sem separar em itens. OK.

Sem violações. Reavaliado após o desenho: mesmo resultado.

## Project Structure

```text
specs/010-comportamentos-desejados/
├── plan.md  research.md  data-model.md  quickstart.md  tasks.md (próxima etapa)
└── contracts/responsibility-maps.md

backend/node/
├── prisma/schema.prisma                  # + behaviors em ResponsibilityMap
├── prisma/migrations/<data>_map_behaviors/migration.sql
├── prompts/analysis-1on1.md              # + uso dos comportamentos (curto)
└── src/modules/
    ├── responsibility-maps/              # schemas, controller, service, repository, map-text
    ├── direct-reports/                   # schema, service, repository (cadastro com versão 1)
    └── analyses/                         # analysis-input, analyses.service (+ testes)

frontend/react/src/features/direct-reports/
├── components/ResponsibilityMapSection.tsx   # campo na edição + exibição por versão
├── components/DirectReportForm.tsx           # campo no cadastro
└── types.ts, hooks/useResponsibilityMaps.ts
```

**Structure Decision**: web, nas pastas que a missão já usa. Nada novo além do que está acima.
