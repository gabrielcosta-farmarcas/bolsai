# API Contract: Bonsai MVP 1

Base `/api/v1`. JSON. Errors: `{ "error": { "code", "message", "details": [] } }`. Dates ISO 8601 (UTC instants; `YYYY-MM-DD` for calendar dates). Lists are paginated (`page`, `pageSize`) and return `{ data, meta: { page, pageSize, total } }`. Header `x-request-id` is echoed. Soft-deleted direct reports return 404 everywhere.

## Direct reports
- `GET /direct-reports?status=` · `POST /direct-reports` `{name, role, startedAt, status?}`
- `GET|PATCH|DELETE /direct-reports/:id` (DELETE = logical deletion, 204)

## Responsibility maps
- `POST /direct-reports/:id/responsibility-maps` multipart `file` (pdf/docx/txt) or JSON `{text}` → 201 new version
- `GET /direct-reports/:id/responsibility-maps` · `GET /responsibility-maps/:id/file`

## Sessions
- `POST /direct-reports/:id/sessions` `{heldOn, transcript}` or multipart `file` (txt/vtt/srt/docx) + `heldOn`
- `GET /direct-reports/:id/sessions` · `GET|PATCH /sessions/:id`

## Analyses
- `POST /sessions/:id/analyses` `{}` → 202 `{id, status:"processing"}`
- `GET /sessions/:id/analyses` · `GET /analyses/:id` (status, rawJson, reviewedJson, error)
- `PUT /sessions/:id/review` `{analysisId, reviewedJson}` → saves final, reconciles agreements

## Agreements
- `GET /agreements?status=&overdue=&directReportId=` · `GET /direct-reports/:id/agreements`
- `PATCH /agreements/:id` `{description?, owner?, dueDate?, status?}`

## Preparation
- `POST /direct-reports/:id/preparations` `{}` → 202 (gera em segundo plano; 422 `RESPONSIBILITIES_REQUIRED` sem 3 a 10 responsabilidades, 503 `AI_NOT_CONFIGURED`) · `GET /direct-reports/:id/preparations/latest` → o último roteiro (`status` processing|completed|failed, `content` quando concluído) ou `null` se nunca houve.

## Timeline
- `GET /direct-reports/:id/timeline` → meetings in order with signals and agreement results

## Export
- `POST /sessions/:id/summary` -> `{ markdown, fileName, exportedAt }` (reviewed sessions only, else 409 `SESSION_NOT_REVIEWED`; marks `summary_exported_at`; summary, themes and agreements only)

## Health
- `GET /health`, `GET /health/ready`
