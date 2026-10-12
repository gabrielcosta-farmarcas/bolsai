---
description: "Task list for Bonsai MVP 1"
---

# Tasks: Bonsai MVP 1 — 1:1 copilot for leaders

**Input**: `specs/001-bonsai-mvp1/` (plan.md, spec.md, data-model.md, contracts/api.md, research.md, quickstart.md)

**Tests**: Included (golden path requires TDD: failing test before production code; Vitest for services, Supertest for HTTP).

**Format**: `- [ ] T### [P?] [US?] Description with file path` — `[P]` = can run in parallel.

**Paths**: API in `backend/node/`, web in `frontend/react/`. Skills to read before each area: `node-api-development` + `node-unit-testing` (API), `schema-design` + `migrations` (DB), `component-development` + `styling-tailwind` + `frontend-design` (web), `containerization`/`local-environment` (Docker). Approval is asked after each phase.

## Phase 1: Setup (Stage 0 — project base)

- [X] T001 Install the `frontend-design` skill with `npx skills add https://github.com/anthropics/skills --skill frontend-design` and confirm it appears under `.claude/skills/`
- [X] T002 Remove the demo `users` module (`backend/node/src/modules/users/`), its route registration in `backend/node/src/app.ts`, and replace the `User` model in `backend/node/prisma/schema.prisma`; keep the shared middlewares/errors
- [X] T003 [P] Rename the application to Bonsai in `README.md`, `backend/node/package.json`, `frontend/react/package.json` and `frontend/react/index.html` (folder and remote names stay)
- [X] T004 [P] Add `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (empty, defined later), `TRANSCRIPT_MAX_CHARS` to `.env.example`, `docker-compose.yml` (api service) and `backend/node/src/config/env.ts` (Zod); analysis endpoints answer a clear error when the key/model is missing
- [X] T005 Migrate the web app to TypeScript (`frontend/react/tsconfig.json`, rename `main.jsx`/`App.jsx` to `.tsx`, `vite.config.ts`) and add lint/type-check scripts
- [X] T006 Add Tailwind 4 (`@tailwindcss/vite`), `@fontsource/fraunces`, `@fontsource/source-serif-4`, `@fontsource/figtree`, React Router and TanStack Query to `frontend/react/package.json`; run `npm install` through the container so the lockfile is updated

## Phase 2: Foundational (blocking — Stage 0)

- [X] T007 Prisma schema for `leaders` with `id`, `name` and a migration inserting the one fixed leader with a constant UUID in `backend/node/prisma/` (create-only, edit SQL, apply on start)
- [X] T008 [P] Security seam in `backend/node/src/shared/security/`: `getCurrentUser()` (returns the fixed leader), `canViewDirectReport(user, report)`, `canViewSession(user, session)` (always allow) + unit tests
- [X] T009 [P] Logger redaction guard in `backend/node/src/shared/logger.ts` and a test proving no `transcript`/`analysis` fields are ever logged
- [X] T010 [P] Pagination helper `{items,page,pageSize,total}` in `backend/node/src/shared/pagination.ts` + tests
- [X] T011 [P] AI client interface `AnthropicClient` + `FakeAiClient` + prompt loader (`prompts/<name>.vN.md`, version from filename) in `backend/node/src/shared/ai/` + tests
- [X] T012 [P] Design tokens (colours: paper background, moss green, terracotta; fonts: Fraunces headings, Source Serif 4 reading, Figtree controls; spacing, ~68ch reading column) in `frontend/react/src/styles/` following `frontend-design` and `styling-tailwind`; document the chosen direction at the top of `tokens.css`
- [X] T013 App shell in `frontend/react/src/components/layout/` and routes in `frontend/react/src/app/` (Portuguese BR labels), API client in `frontend/react/src/lib/api.ts`
- [X] T014 Verify stage 0: `docker compose up -d --build --wait`, all services healthy, page opens, `npm run lint`, type-check and tests green in both services

**Checkpoint**: base running; ask approval before Phase 3.

## Phase 3: User Story 1 — Direct reports and responsibility maps (P1) — Stage 1

**Goal**: manage people and map versions; logical deletion hides everything of a person.
**Independent test**: create person, upload 2 map versions, delete person, nothing of them visible anywhere.

### Tests first
- [X] T015 [P] [US1] Service unit tests for direct reports (validation, status, delete) in `backend/node/src/modules/direct-reports/direct-reports.service.test.ts`
- [X] T016 [P] [US1] Unit tests for text extraction (txt, docx, pdf with text, pdf without text rejected, >10 MB rejected) in `backend/node/src/shared/files/extract-text.test.ts`
- [X] T017 [P] [US1] Integration tests for `/direct-reports` and `/direct-reports/:id/responsibility-maps` (versions 1→2, 404 after delete) in `backend/node/src/modules/direct-reports/direct-reports.routes.integration.test.ts`

### Implementation
- [X] T018 [US1] Prisma models + migration for `direct_reports` (`name` text collation `pt_br`, `role`, `started_at` date, `status` `active`|`inactive`, `deleted_at timestamptz NULL`, `leader_id` FK) and `responsibility_maps` (`UNIQUE (direct_report_id, version)`, `file_type` `pdf`|`docx`|`text`, `text`, `file_bytes` bytea NULL); create collation and partial index `(leader_id, status) WHERE deleted_at IS NULL` in migration SQL
- [X] T019 [P] [US1] Text extraction (`.txt`, `.docx` via `mammoth`, PDF via `unpdf`, 10 MB limit via `multer` memory) in `backend/node/src/shared/files/extract-text.ts`
- [X] T020 [US1] Direct reports repository (always filters `deleted_at IS NULL` and `leader_id`), service, controller, Zod schemas, routes in `backend/node/src/modules/direct-reports/`
- [X] T021 [US1] Responsibility maps repository/service/controller/routes (new version = max+1, file download) in `backend/node/src/modules/responsibility-maps/`, joining only active direct reports
- [X] T022 [P] [US1] Web: direct reports list/form/detail and map upload with version list in `frontend/react/src/features/direct-reports/`; pages in `frontend/react/src/app/`
- [X] T023 [US1] Seed fictional direct reports and a map in `backend/node/seeds/` (SQL, UTF-8, idempotent)
- [X] T024 [US1] Verify stage 1 per `quickstart.md`

**Checkpoint**: US1 works alone; ask approval.

## Phase 4: User Story 2 — Record a 1:1 and review the analysis (P1) — Stage 2

**Goal**: transcript in, async AI analysis, editable review saved as final, reprocess and compare.
**Independent test**: paste fictional transcript, analyse, edit, save; session shows reviewed.

### Tests first
- [X] T025 [P] [US2] Unit tests for transcript parsers (`.txt`, `.vtt`, `.srt` keep speaker/drop timestamps, `.docx`) in `backend/node/src/shared/files/parse-transcript.test.ts`
- [X] T026 [P] [US2] Zod analysis schema tests (valid, invalid owner, `due_date` null/`YYYY-MM-DD`, agreement without `evidence_excerpt` rejected) in `backend/node/src/modules/analyses/analysis.schema.test.ts`
- [X] T027 [P] [US2] Service tests with `FakeAiClient`: success, invalid-then-valid (one retry), invalid twice → `failed`, missing key/model, transcript above `TRANSCRIPT_MAX_CHARS` rejected, stuck `processing` → `failed` on boot in `backend/node/src/modules/analyses/analyses.service.test.ts`
- [X] T028 [P] [US2] Integration tests: `POST /sessions/:id/analyses` → 202, polling, `PUT /sessions/:id/review`, one final per session, reprocess keeps final until new review, deleted report → 404 in `backend/node/src/modules/analyses/analyses.routes.integration.test.ts`

### Implementation
- [X] T029 [US2] Migration + models for `sessions` (`status` `draft`|`analysed`|`reviewed`, `held_on` date, `transcript`, `summary_exported_at`) and `analyses` (`status` `processing`|`completed`|`failed`, `prompt_version`, `model`, `map_version_used`, `raw_json` jsonb, `reviewed_json` jsonb, `reviewed_at`, token counts; partial unique index `(session_id) WHERE reviewed_at IS NOT NULL`)
- [X] T030 [P] [US2] Transcript parsers in `backend/node/src/shared/files/parse-transcript.ts`
- [X] T031 [P] [US2] Analysis Zod schema (keys from data-model.md: `summary`, `themes`, `agreements`, `previous_agreements`, `development_signals`, `attention_points`, `next_questions`, `private_leader_notes`) and JSON Schema export for tool use in `backend/node/src/modules/analyses/analysis.schema.ts`
- [X] T032 [P] [US2] Prompt `backend/node/prompts/analysis-1on1.md` with the rules: use only transcript/history, no invention, deadline null when unstated, evidence for every agreement, link signals to the map, no psychological/health/personality judgement, constructive tone, strategic questions about career/blockers/motivation/feedback to leader/next challenges
- [X] T033 [US2] Real Anthropic client (forced tool use, token usage, no content logging) in `backend/node/src/shared/ai/anthropic-client.ts`
- [X] T034 [US2] Sessions module (create from text or file, list, get, patch) in `backend/node/src/modules/sessions/`
- [X] T035 [US2] Analyses module: context builder (map, last 3 reviewed final summaries, open agreements), async job with one validation retry, boot recovery, list/get, review save in `backend/node/src/modules/analyses/`
- [X] T036 [P] [US2] Web: new 1:1 form (paste or file) in `frontend/react/src/features/sessions/`
- [X] T037 [US2] Web: analysis review screen (reading-first, editable fields, evidence beside agreements, suggested status for previous agreements, progress/error state with polling, "Reprocessar" with prompt version and side-by-side compare) in `frontend/react/src/features/analysis-review/`
- [X] T038 [P] [US2] Fictional transcripts with expected agreements in `backend/node/fixtures/` and `backend/node/scripts/evaluate-prompt.ts` (`npm run evaluate`), seed a reviewed session
- [ ] T039 [US2] Verify stage 2 per `quickstart.md` with the real API key (done with the fake AI and demo data; the real-key run is pending the key and model)

**Checkpoint**: US2 works; ask approval.

## Phase 5: User Story 3 — Agreements and timeline (P2) — Stage 3

**Goal**: agreements editable per person and overall; development timeline.
**Independent test**: review 3 sessions of one person; timeline shows them in order with signals and agreement results.

- [X] T040 [P] [US3] Unit tests: auto-save of AI agreements when an analysis completes (created open, `origin` `ai`, `confirmed_at` null), replacement of unconfirmed AI agreements on reprocess (confirmed and manual kept; reviewed session untouched), reconcile on review (create, update by id, cancel removed, no duplicates, set `confirmed_at`), overdue computed in America/Sao_Paulo, in `backend/node/src/modules/agreements/agreements.service.test.ts`
- [X] T041 [P] [US3] Integration tests for `/agreements`, `/direct-reports/:id/agreements`, `/direct-reports/:id/timeline` in `backend/node/src/modules/agreements/` and `timeline/`
- [X] T042 [US3] Migration + model for `agreements` (`owner` `leader`|`report`, `status` `open`|`done`|`cancelled`, `due_date` NULL, `evidence_excerpt`, `closed_at`, `origin` `ai`|`leader`, `analysis_id` NULL FK, `confirmed_at` NULL, index `(direct_report_id, status)`)
- [X] T043 [US3] Agreements module; hook auto-save into the analysis completion (`analyses.service.ts`, `markCompleted` step) and the reconcile step into the review save; replace the empty open-agreements provider in `analyses.routes.ts` with the real list so the next analysis sees them in `backend/node/src/modules/agreements/`
- [X] T043a [US2] Saving a transcript starts the analysis automatically: after creating the 1:1 the web app starts the analysis and opens the encounter page (if the AI is not configured the 1:1 stays saved and the page shows the message) in `frontend/react/src/app/NewSessionPage.tsx` and `features/sessions/`
- [X] T044 [US3] Timeline module (meetings in date order, signals per responsibility, agreements done vs not done) in `backend/node/src/modules/timeline/`
- [X] T045 [P] [US3] Web: agreements list per person and overview with overdue highlight and inline edit in `frontend/react/src/features/agreements/`
- [X] T046 [US3] Web: timeline as hand-drawn SVG branch (node per meeting, leaves for growth, marks for attention, agreements beside nodes) in `frontend/react/src/features/timeline/`
- [X] T047 [US3] Leak test: a deleted direct report's data absent from agreements overview, timeline and analysis context in `backend/node/src/modules/direct-reports/deletion-visibility.integration.test.ts`
- [X] T048 [US3] Verify stage 3 per `quickstart.md`

**Checkpoint**: ask approval.

## Phase 6: User Story 4 — Prepare the next 1:1 (P2) — Stage 4

**Goal**: on-demand preparation grounded in history.
**Independent test**: after 2 reviewed sessions, preparation cites both.

- [ ] T049 [P] [US4] Preparation Zod schema tests (3–5 questions, `has_history`) and service tests with `FakeAiClient` (no history case) in `backend/node/src/modules/preparations/`
- [ ] T050 [P] [US4] Integration tests for `POST /direct-reports/:id/preparations` and `GET .../latest` in `backend/node/src/modules/preparations/preparations.routes.integration.test.ts`
- [ ] T051 [US4] Migration + model for `preparations` (`model`, `content` jsonb)
- [ ] T052 [P] [US4] Prompt `backend/node/prompts/preparation.md` (open/overdue agreements, recurring/pending themes, 3 to 5 strategic questions not about task status, under-discussed map points)
- [ ] T053 [US4] Preparations module (deterministic open/overdue agreements from DB + AI for themes/questions/gaps; async like analyses) in `backend/node/src/modules/preparations/`
- [ ] T054 [US4] Web: preparation screen on the direct report page in `frontend/react/src/features/preparation/`
- [ ] T055 [US4] Verify stage 4 per `quickstart.md`

**Checkpoint**: ask approval.

## Phase 7: User Story 5 — Share a summary (P3) — Stage 5

**Goal**: copy/export Markdown without transcript or private notes.
**Independent test**: marker text in transcript and private notes never appears in the export.

- [X] T056 [P] [US5] Leak test + service tests (reviewed only, sets `summary_exported_at`, whitelisted fields) in `backend/node/src/modules/export/export.service.test.ts` and `export.routes.integration.test.ts`
- [X] T057 [US5] Export module generating Markdown from a whitelist (summary, themes, agreements); never reads transcript, `private_leader_notes` or `leader_feedback` in `backend/node/src/modules/export/`
- [X] T058 [US5] Web: "Copiar" and "Exportar" buttons on the reviewed session in `frontend/react/src/features/sessions/`
- [ ] T059 [US5] Verify stage 5 per `quickstart.md`

## Phase 8: Polish

- [ ] T060 [P] Update `README.md` with Bonsai overview, env vars, how to run tests and the prompt evaluation script
- [ ] T061 [P] Run `scripts/sync-templates.sh` if the sync check requires it; confirm CI (`.github/workflows/ci.yml`) is green
- [ ] T062 Final pass of `quickstart.md`, accessibility check (keyboard, labels) on the main screens, and confirm logs contain no transcript/analysis text

## Dependencies & order

- Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → US5 → Polish.
- US2 needs US1 (people and maps). US3 needs US2 (reviews). US4 needs US3 (agreements, signals). US5 needs US2.
- Within a phase: tests (fail first) → migration/models → services → routes → web.
- Parallel examples: T003/T004; T008–T012; T015–T017; T025–T028; T036/T038.

## Strategy

Deliver stage by stage; stop for approval after each checkpoint. The MVP slice is Phases 1–4 (people + analysis + review), the part that validates analysis quality.
