# Quickstart: validating Bonsai MVP 1

Prerequisites: Docker Desktop open; `.env` from `.env.example`; `ANTHROPIC_API_KEY` set (and `ANTHROPIC_MODEL`, chosen later) for analysis stages.

```bash
docker compose up -d --build --wait
docker compose ps          # postgres, api, web healthy
```

Open http://localhost:3000.

| Stage | Check | Expected |
|---|---|---|
| 0 | Open the app | Bonsai shell loads; `/health/ready` OK |
| 1 | Create a person, upload 2 map versions, delete the person | Versions listed, latest current; person and data vanish from all screens |
| 2 | Paste `fixtures/` transcript, Analyse, edit, Save | Result appears; saved final; session "reviewed" |
| 3 | Review 3 sessions for one person | Agreements editable; overdue highlighted; timeline in order |
| 4 | Prepare after 2 sessions | Cites agreements and themes from both |
| 5 | Export a reviewed session | Markdown has summary, themes, agreements; no transcript, no private notes |

Automated: `docker compose exec api npm run lint && npm test && npm run test:integration`; web: `docker compose exec web npm run build`. Prompt evaluation: `docker compose exec api npm run evaluate` (real API, spends tokens).
