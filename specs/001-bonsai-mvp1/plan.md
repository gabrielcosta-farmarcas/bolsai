# Implementation Plan: Bonsai MVP 1 — 1:1 copilot for leaders

**Branch**: `001-bonsai-mvp1` | **Date**: 2026-10-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-bonsai-mvp1/spec.md`

## Summary

A web app where one fixed leader registers direct reports and their responsibilities map, records 1:1 transcripts, gets an AI analysis (Claude) that is reviewed and saved as final, tracks agreements, sees a development timeline, generates a preparation for the next 1:1 and exports a shareable summary. Built on the existing golden-path skeleton (Node 22 + TypeScript + Express + Prisma + Zod, PostgreSQL 16, React + Vite + Tailwind, Docker Compose). Delivered in stages 0–5 (see Delivery stages). Code organised so Phase 3 (sign-in, encryption, audit, LGPD) enters without rewrite.

## For the reader

Chosen: build on the project's standard stack and add a Claude connection that runs analyses in the background, with a single prompt file (`prompts/analysis-1on1.md`) kept in the repository (Git is the history).

Why: it reuses what already runs here, keeps the screen responsive during long analyses, and keeps one fixed prompt in the application.

## Technical Context

**Language/Version**: TypeScript on Node 22 (API); TypeScript + React 18 (web)

**Primary Dependencies**: Express 5, Prisma 7 (+ pg adapter), Zod 4, pino; new: `@anthropic-ai/sdk`, `multer`, `mammoth` (.docx), `unpdf` (PDF); web new: Tailwind 4 (`@tailwindcss/vite`), React Router, TanStack Query, `@fontsource` fonts

**Storage**: PostgreSQL 16 (UTF8, ICU `pt_br` collation for names); AI output kept as `jsonb`

**Testing**: Vitest (unit, AI client faked), Supertest (HTTP integration on `<db>_test`), leak tests (export, logs); manual prompt evaluation script against fictional fixtures (not in CI)

**Target Platform**: Docker Compose on the developer machine; ports on 127.0.0.1 only

**Project Type**: web application (API + SPA)

**Performance Goals**: pages respond < 500 ms excluding AI; AI analysis is async (typically 10–60 s); full flow transcript → reviewed summary < 10 min (SC-004)

**Constraints**: no secrets in git; logs never contain transcript or analysis text; Phase 3 hooks (`leader_id`, `getCurrentUser`, `canViewSession`); AI key and model from env

**Scale/Scope**: 1 leader, ~6 direct reports, ~1 session / 3 weeks each; ~8 screens

## Constitution Check

| Principle | Status |
|---|---|
| I Spec Kit | Pass: spec → plan → tasks → implement with approvals |
| II Everything in Docker | Pass: only the existing 3 services; new env vars in `.env.example` |
| III Default stack | Pass; additions justified in Complexity Tracking |
| IV DB only by migration | Pass: Prisma Migrate; partial indexes/collation via hand-edited SQL |
| V Local data protected | Pass: no destructive command without confirmation |
| VI Plain language | Pass |
| VII Start small | Pass: stages 0–5, each verifiable end to end |
| VIII Agent decides tech | Pass: decisions in research.md |

Post-design re-check: pass (no new violations).

## Project Structure

### Documentation (this feature)

```text
specs/001-bonsai-mvp1/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
├── checklists/requirements.md
└── tasks.md            # next step (/speckit-tasks)
```

### Source Code (repository root)

```text
backend/node/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── prompts/
│   ├── analysis-1on1.v1.md
│   └── preparation.v1.md
├── fixtures/                      # fictional transcripts + expected agreements
├── seeds/                         # fictional demo data (SQL, UTF-8)
├── scripts/evaluate-prompt.ts     # runs the prompt against fixtures
└── src/
    ├── config/env.ts              # + ANTHROPIC_API_KEY, ANTHROPIC_MODEL
    ├── shared/
    │   ├── security/              # getCurrentUser, canViewDirectReport, canViewSession
    │   ├── ai/                    # AnthropicClient + FakeClient, prompt loader, retry
    │   └── files/                 # text extraction: txt, vtt, srt, docx, pdf
    └── modules/
        ├── direct-reports/        # routes, controller, service, repository, schemas
        ├── responsibility-maps/
        ├── sessions/
        ├── analyses/              # async job, review, reprocess, compare
        ├── agreements/
        ├── preparations/
        ├── timeline/
        └── export/

frontend/react/src/
├── app/                           # route pages (thin)
├── components/{ui,layout}/
├── features/{direct-reports,sessions,analysis-review,agreements,timeline,preparation}/
├── lib/                           # api client, formatters
└── styles/                        # Tailwind tokens, fonts
```

**Structure Decision**: keep the existing two-service layout; replace the demo `users` module with the domain modules above, all using routes → controller → service → repository. The frontend moves from JSX to TypeScript to follow `component-development`.

## Key design decisions

1. **Phase 3 seams.** Every table has `leader_id`. `shared/security/` is the only place that knows the current user and permissions (today: fixed leader, always allowed). Repositories take `leaderId`; services call the permission functions; field encryption can later be plugged in repositories.
2. **Logical deletion.** Only `direct_reports.deleted_at`. Every child read goes through an active direct report (join/filter in repositories), including agreements overview, timeline, previous-summary lookups for analysis, preparation and export. A leak test proves a deleted report's data appears nowhere.
3. **AI calls.** Claude is called with structured outputs (`output_config.format`, JSON Schema generated from the Zod schema); the returned text is parsed and validated with Zod; on failure one retry that includes the validation error; then the analysis is stored with status `failed` and a readable reason. The model comes from `ANTHROPIC_MODEL` (set later). Prompt files carry the version in the filename; the version is stored on each analysis/preparation.
4. **Async analysis.** `POST` returns 202 with status `processing`; an in-process task does the call; the web app polls. On API start, rows stuck in `processing` become `failed`.
5. **Review semantics.** At most one final analysis per session (partial unique index on `reviewed_at IS NOT NULL`). Agreements are saved automatically when an analysis completes (origin `ai`, unconfirmed), replacing only the unconfirmed AI agreements of a session that has no final review; saving a review sets session `reviewed`, stores `reviewed_json`, and reconciles agreements by id (create/update/cancel, never duplicate) marking them confirmed. Reprocessing creates a new draft analysis; the current final stays until a new review is saved. Suggested status for previous agreements applies only on save.
6. **Overdue** is computed (deadline < today in America/Sao_Paulo and status open), never stored.
7. **Export** is built server-side from a whitelist (summary, themes, agreements); the transcript and private notes are never read by the export code. Only reviewed sessions can be exported.
8. **Logs** only IDs, sizes, durations, model and token counts.
9. **Visual identity.** The "Camadas" brand direction is mandatory and documented in `frontend/BRAND.md` (single token file `tokens.css` with light/dark theme, `<Logo />` component, Alegreya Sans + Source Sans 3, 1 px borders, no shadows, Musgo/Argila palette, tone of voice). It replaces the earlier direction chosen in stage 0. The timeline (stage 3) is built with the same tokens.
10. **Encounter screen layout.** Chosen by the user among four prototypes ("B — lado a lado"): transcript on the left with the AI's evidence excerpts highlighted, analysis on the right in tabs (Resumo, Combinados, Evolução, Perguntas, Notas privadas) with a fixed footer (Descartar edições, Salvar versão final); hovering or focusing an agreement lights its excerpt in the transcript; on narrow screens it becomes one column.

## Delivery stages

| Stage | Scope | Done when |
|---|---|---|
| 0 | Install `frontend-design`; remove demo `users`; rename to Bonsai; env vars; fixed-leader migration; security seam; Tailwind tokens + app shell; web to TypeScript | `docker compose up` healthy; page opens; DB connected; lint, types, tests green |
| 1 | Direct reports CRUD (logical delete), responsibility map upload/versions, text extraction | Delete hides everything of the person (leak test); versions listed |
| 2 | Sessions, transcript intake, async analysis, Zod validation + retry, review screen, reprocess + compare, fixtures | Valid analysis, editable, saved as final |
| 3 | Agreements (from review, editable, per person + overview), timeline | Three reviewed sessions show correct timeline |
| 4 | Preparation with its own prompt | 2nd/3rd preparation cites earlier meetings |
| 5 | Markdown export + copy | Export has no transcript and no private notes |

## Complexity Tracking

| Addition | Why needed | Simpler alternative rejected because |
|---|---|---|
| `@anthropic-ai/sdk` | Required AI provider; typed tool use | Hand-written HTTP adds retries/typing work |
| `multer`, `mammoth`, `unpdf` | Upload and text extraction for PDF/DOCX | No built-in way to read these formats |
| React Router, TanStack Query | ~8 screens with polling and cache | Manual routing/polling is more code and bugs |
| Tailwind 4 + `@fontsource/*` | Required by the golden path; offline fonts | CDN fonts add an external dependency |
