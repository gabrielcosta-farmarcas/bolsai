# Research: Bonsai MVP 1

All decisions are the agent's (constitution VIII). No open questions.

| # | Topic | Decision | Rationale | Alternatives considered |
|---|---|---|---|---|
| 1 | Structured AI output | Structured outputs (`output_config.format` with the JSON Schema generated from the Zod schema via the SDK's `zodOutputFormat`), then Zod validation in our code; one retry that includes the validation reason | Works on every current model, including the newest ones, which reject forced `tool_choice` (HTTP 400). Zod is already the project validator | Forced tool use (rejected by Fable 5.1 / Opus 5.5 / Sonnet 5.5); free-text JSON parsing (fragile) |
| 2 | Long-running analysis | In-process async task + polling; stuck rows failed on boot | No queue infrastructure needed for 1 user | BullMQ/Redis (extra service); SSE (more moving parts) |
| 3 | Prompt versioning | Markdown files `prompts/<name>.vN.md`, loaded by name+version; version stored per result | Diffable in git; trivial to compare | DB-stored prompts (not reviewable in PRs) |
| 4 | Comparing prompt versions | Multiple analyses per session; UI side-by-side; `npm run evaluate` for fixtures | Directly serves "iterate on the prompt" | Overwriting the analysis (loses comparison) |
| 5 | Primary keys | UUIDv7 | Matches existing skeleton and DATABASE.md | bigint identity |
| 6 | Deletion | Logical, on `direct_reports` only; children filtered via active report | User choice; simple, no forgotten filters per table | `deleted_at` on every table; physical delete |
| 7 | AI output storage | `jsonb` for raw/reviewed analysis and preparation content; agreements are real rows | JSON is a snapshot, agreements need querying/editing | Normalise every analysis field (heavy, no query need) |
| 8 | File parsing | `.txt` native; `.vtt/.srt` small parser keeping speaker; `mammoth` for `.docx`; `unpdf` for PDF; 10 MB limit; PDFs without text rejected | Small, pure-JS, works in Alpine containers | `pdf-parse` (unmaintained), OCR (out of scope) |
| 9 | Original map file | Stored as `bytea` plus extracted text | Download later; no extra volume | Disk volume (another thing to back up/delete) |
| 10 | Frontend data | React Router + TanStack Query + `fetch` wrapper; TypeScript | Polling and cache built in; skill requires TS | Redux; plain `useEffect` |
| 11 | Timeline drawing | Hand-written SVG | Custom visual identity; no chart library | Recharts/D3 |
| 12 | Fonts | `@fontsource` packages, self-hosted | No external requests | Google Fonts CDN |
| 13 | Time zone | America/Sao_Paulo for "today"/overdue; all instants stored UTC | Leader's local calendar day | UTC day (off by hours) |
| 14 | Names | English identifiers; UI strings Portuguese (BR) | User choice | — |
| 15 | Fixed leader | Row inserted by migration with a constant id; seed adds fictional data only | App works without running the seed | Seed-only leader |
| 16 | Token/size safety | Reject transcripts above a configured character limit with a clear message | No chunking in MVP | Automatic chunking/summarisation |
