# Data Model: Bonsai MVP 1

PostgreSQL 16, UTF8. PK = UUIDv7 (app-generated), `snake_case`, plural tables, instants `timestamptz`. Every table has `leader_id` (FK to `leaders`), `created_at`, `updated_at`. Text shown to people that is sorted (names) uses collation `pt_br`.

## leaders
`id`, `name`. One fixed row created by migration.

## direct_reports
`id`, `leader_id`, `name` (pt_br), `role`, `started_at` (date), `status` (`active`|`inactive`), `deleted_at` (null = visible). Index on `(leader_id, status)` where `deleted_at IS NULL`.

## responsibility_maps
`id`, `leader_id`, `direct_report_id`, `version` (int), `file_name`, `file_type` (`pdf`|`docx`|`text`), `text`, `mission` and `responsibilities` (nullable, filled when created on screen; `text` is the two sections joined under the titles MISSÃO / FINALIDADE DO CARGO and RESPONSABILIDADES), `file_bytes` (bytea, null for pasted text). `UNIQUE (direct_report_id, version)`. Current = highest version.

## sessions
`id`, `leader_id`, `direct_report_id`, `held_on` (date), `transcript`, `status` (`draft`|`analysed`|`reviewed`), `summary_exported_at`. Index `(direct_report_id, held_on)`.

## analyses
`id`, `leader_id`, `session_id`, `model`, `status` (`processing`|`completed`|`failed`), `error_message`, `map_version_used`, `raw_json` (jsonb), `reviewed_json` (jsonb), `reviewed_at`, `input_tokens`, `output_tokens`. Partial unique index on `(session_id) WHERE reviewed_at IS NOT NULL` (one final per session).

`raw_json`/`reviewed_json` shape (Zod-validated, Portuguese content, English keys):
`summary`, `themes[{title, detail}]`, `agreements[{id?, description, owner: leader|report, due_date|null, evidence_excerpt}]`, `previous_agreements[{id, suggested_status: done|in_progress|not_mentioned|cancelled, evidence}]`, `development_signals[{responsibility, observation, kind: growth|attention|neutral}]`, `attention_points[]`, `next_questions[]`, `private_leader_notes`.

## agreements
`id`, `leader_id`, `direct_report_id`, `origin_session_id`, `description`, `owner` (`leader`|`report`), `due_date` (null), `status` (`open`|`done`|`cancelled`), `evidence_excerpt`, `closed_at`. Index `(direct_report_id, status)`. Overdue is computed. Added for automatic saving: `origin` (`ai`|`leader`), `analysis_id` (nullable FK: which analysis created it), `confirmed_at` (null while an AI agreement is untouched; set when the leader edits it or saves the review). Replacement rule when an analysis finishes for a session with no final review: delete that session's agreements with `origin = 'ai' AND confirmed_at IS NULL`, then insert the new ones; confirmed ones and manual ones are kept. A saved review sets `confirmed_at` on its agreements.

## preparations
`id`, `leader_id`, `direct_report_id`, `model`, `status` (reaproveita `analysis_status`), `error_message`, `map_version_used`, `content` (jsonb: `open_agreements`, `themes` (até 4), `questions` (3–5), `map_gaps`, `has_history`), tokens. `open_agreements` e `map_gaps` são calculados no servidor, sem IA: combinados abertos (com atraso) e responsabilidades ativas que não tiveram observação nos 3 últimos encontros revisados (com a data da última conversa, ou nula). Só `themes` e `questions` vêm da IA. O prompt (`prompts/preparation.md`) não é editável em Configurações.

## Visibility rule
Every read of sessions, analyses, agreements, preparations, maps and timeline joins `direct_reports` with `deleted_at IS NULL`.

## State transitions
- Session: `draft` → `analysed` (analysis completed) → `reviewed` (review saved). Reprocess does not change a `reviewed` session.
- Analysis: `processing` → `completed` | `failed`; `completed` → final when reviewed.
- Agreement: `open` → `done` | `cancelled`; reopenable by the leader.

## Seed
`seeds/` SQL with fictional direct reports, a map, and 2–3 sessions with reviewed analyses; fictional transcripts in `fixtures/`.
