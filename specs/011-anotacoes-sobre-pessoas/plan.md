# Implementation Plan: Anotações sobre pessoas

**Branch**: `main` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

## Summary

Dois recursos novos no banco (anotação e passo do plano), um módulo novo na API (`notes`) e uma feature nova na tela (`notes`), exibida como a aba "Anotações" na página da pessoa. Promover um passo reaproveita o módulo de Combinados; "levar ao próximo encontro" é uma marca na anotação, lida pela aba "Preparar 1:1" (sem passar pela IA). O acesso segue a regra que já vale para tudo: só a líder dona enxerga.

## For the reader

Chosen: guardar a anotação e os passos em duas tabelas novas, ligadas à pessoa, e mostrar tudo numa aba nova da página da pessoa.

Why: é o mesmo desenho de Combinados e Encontros, então a tela e a regra de "só a líder vê" funcionam igual às que já existem.

Chosen: a situação (sem plano, em andamento, resolvida) não é guardada, é calculada dos passos e da marca de "resolvida".

Why: evita a situação ficar errada quando um passo é adicionado ou removido.

Chosen: promover um passo cria um Combinado de verdade e guarda o vínculo no passo.

Why: o Combinado passa a aparecer em todo lugar onde já aparece, e o vínculo impede criar duplicado.

Chosen: a IA não lê as anotações nesta versão.

Why: são notas privadas da líder; misturar com a análise do encontro é outra decisão, que fica para depois.

## Technical Context

**Language/Version**: TypeScript (Node 20 na API, React + Vite na tela), como o resto do projeto
**Primary Dependencies**: Prisma, Zod, Vitest, Tailwind, TanStack Query (já em uso)
**Storage**: PostgreSQL 16; 2 tabelas novas e 1 enum novo (migration Prisma, só adiciona)
**Testing**: Vitest (service, regra de situação), testes de rota de integração (acesso só do dono), testes de componente
**Target Platform**: Docker Compose local e Coolify
**Project Type**: web (frontend + backend)
**Performance Goals**: sem impacto; listas de dezenas de anotações por pessoa
**Constraints**: nada que existe pode mudar de comportamento; tela segue `frontend/BRAND.md`
**Scale/Scope**: 2 tabelas, ~8 endpoints, 1 aba, 1 bloco na aba Preparar

## Constitution Check

- I Spec Kit: spec, plano e tarefas antes do código. OK.
- II Docker: nada fora do Compose. OK.
- III Stack padrão: a do projeto, sem tecnologia nova. OK.
- IV Banco só por migration: migration Prisma que só adiciona tabelas. OK.
- V Dados locais protegidos: nenhum comando que apague dados. OK.
- VI/VIII Linguagem simples, agente decide o técnico. OK.
- VII Começar pequeno: sem tipos livres, anexos, lembretes ou IA. OK.

Sem violações. Reavaliado após o desenho: mesmo resultado.

## Project Structure

```text
specs/011-anotacoes-sobre-pessoas/
├── plan.md  research.md  data-model.md  quickstart.md  tasks.md (próxima etapa)
└── contracts/notes.md

backend/node/
├── prisma/schema.prisma                          # + Note, NoteStep, enum NoteKind
├── prisma/migrations/<data>_notes/migration.sql
└── src/modules/notes/                            # routes, controller, schemas, service, repository (+ testes)
    └── (promoção reaproveita agreements.repository)
backend/node/src/shared/security/authorization.ts # + canViewNote

frontend/react/src/features/notes/
├── components/ NoteForm, NoteList, NoteItem, PlanSteps, NoteFilters
├── hooks/ useNotes, useNoteMutations
└── index.ts, types.ts
frontend/react/src/app/DirectReportPage.tsx       # + aba "anotacoes"
frontend/react/src/features/preparation/          # + bloco "Anotações levadas ao encontro"
```

**Structure Decision**: web, seguindo o padrão `modules/<recurso>` na API e `features/<recurso>` na tela. Sem pastas fora disso.
