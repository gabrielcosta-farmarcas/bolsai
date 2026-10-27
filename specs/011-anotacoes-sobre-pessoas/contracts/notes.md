# Contratos: anotações

Base `/api/v1`. Só a líder dona; outra pessoa recebe `404`. Erros no formato padrão `{ error: { code, message, details } }`.

| Método e rota | Faz | Corpo / resposta |
| --- | --- | --- |
| `GET /direct-reports/:id/notes?status=open\|resolved` | Lista da pessoa, mais recente primeiro | `{ data: Note[], counts: { all, open, resolved } }` |
| `POST /direct-reports/:id/notes` | Cria | `{ kind, description, notedAt? }` → `Note` |
| `PATCH /notes/:id` | Edita ou muda a marca | `{ kind?, description?, notedAt?, resolved?: boolean, bringToNextSession?: boolean }` → `Note` |
| `DELETE /notes/:id` | Exclui (lógica) | `204` |
| `POST /notes/:id/agreements` | Cria um combinado ligado à anotação | `{ description, owner: leader\|report, dueDate? }` → `Note` |
| `GET /direct-reports/:id/notes/for-next-session` | Anotações marcadas e não resolvidas | `Note[]` |

## Note
```
{ id, directReportId, kind, description, notedAt, status, bringToNextSession,
  resolvedAt, createdAt,
  agreements: [{ id, description, owner, dueDate, status: open|done, isOverdue }] }
```

## Validação
- `description`: 1–2.000; `description` do combinado: 1–2.000; datas `AAAA-MM-DD`; `kind` e `owner` dos valores acima.
- `code: "validation_error"` para erro de campo; `NOTE_NOT_FOUND`, `DIRECT_REPORT_NOT_FOUND` para 404.

Marcar como feito ou cancelar um combinado da anotação usa a rota existente `PATCH /agreements/:id` (`status`).
