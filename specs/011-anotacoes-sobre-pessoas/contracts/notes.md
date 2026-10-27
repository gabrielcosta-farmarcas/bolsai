# Contratos: anotações

Base `/api/v1`. Só a líder dona; outra pessoa recebe `404`. Erros no formato padrão `{ error: { code, message, details } }`.

| Método e rota | Faz | Corpo / resposta |
| --- | --- | --- |
| `GET /direct-reports/:id/notes?status=no_plan\|in_progress\|resolved` | Lista da pessoa, mais recente primeiro | `{ data: Note[], counts: { all, no_plan, in_progress, resolved } }` |
| `POST /direct-reports/:id/notes` | Cria | `{ kind, description, notedAt? }` → `Note` |
| `PATCH /notes/:id` | Edita ou muda a marca | `{ kind?, description?, notedAt?, resolved?: boolean, bringToNextSession?: boolean }` → `Note` |
| `DELETE /notes/:id` | Exclui (lógica) | `204` |
| `POST /notes/:id/steps` | Adiciona passo | `{ text, dueDate?, owner? }` → `Note` |
| `PATCH /notes/:id/steps/:stepId` | Edita ou marca feito | `{ text?, dueDate?, owner?, done?: boolean }` → `Note` |
| `DELETE /notes/:id/steps/:stepId` | Remove passo | `Note` |
| `POST /notes/:id/steps/:stepId/agreement` | Promove a Combinado | `Note` (passo com `agreementId`); repetir não duplica |
| `GET /direct-reports/:id/notes/for-next-session` | Anotações marcadas e não resolvidas | `Note[]` |

## Note
```
{ id, directReportId, kind, description, notedAt, status, bringToNextSession,
  resolvedAt, createdAt,
  steps: [{ id, position, text, dueDate, owner, done, doneAt, isOverdue, agreementId }],
  progress: { done, total } }
```

## Validação
- `description`: 1–2.000; `text` do passo: 1–500; datas `AAAA-MM-DD`; `kind` e `owner` dos valores acima.
- `code: "validation_error"` para erro de campo; `NOTE_NOT_FOUND`, `STEP_NOT_FOUND`, `DIRECT_REPORT_NOT_FOUND` para 404.
