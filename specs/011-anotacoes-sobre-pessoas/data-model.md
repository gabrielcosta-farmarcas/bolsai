# Data model: Anotações sobre pessoas

## Enum `note_kind`
`agreement_missed` (Combinado não cumprido) · `attention` (Ponto de atenção) · `praise` (Elogio)

## `notes`
| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid v7 | PK |
| leader_id | uuid | FK leaders; dono |
| direct_report_id | uuid | FK direct_reports |
| kind | note_kind | obrigatório |
| description | text | obrigatório, 1 a 2.000 caracteres (após trim) |
| noted_at | date | obrigatório, padrão hoje (São Paulo) |
| resolved_at | timestamptz? | preenchido = Resolvida |
| bring_to_next_session | boolean | padrão falso; vira falso ao resolver |
| deleted_at | timestamptz? | exclusão lógica |
| created_at / updated_at | timestamptz | |

Índices: `(direct_report_id, noted_at desc)` parcial onde `deleted_at is null`; `(leader_id)`.

## `note_steps`
| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid v7 | PK |
| note_id | uuid | FK notes |
| leader_id | uuid | FK leaders (isolamento) |
| position | int | ordem na lista |
| text | text | obrigatório, 1 a 500 |
| due_date | date? | opcional |
| owner | agreement_owner | `leader` (padrão) ou `report` |
| done_at | timestamptz? | preenchido = feito |
| agreement_id | uuid? | FK agreements; preenchido = já virou Combinado (único por passo) |
| created_at / updated_at | timestamptz | |

Índice: `(note_id, position)`.

## Situação (calculada, não guardada)
- `resolved_at` não nulo → `resolved`
- senão, passos ≥ 1 → `in_progress`
- senão → `no_plan`

## Regras de transição
- Adicionar o primeiro passo: `no_plan` → `in_progress`. Remover o último: volta a `no_plan`.
- Resolver: grava `resolved_at`, zera `bring_to_next_session`. Reabrir: limpa `resolved_at`.
- Passo atrasado: `due_date` anterior a hoje, sem `done_at` (calculado na resposta).
- Promover: só se `agreement_id` for nulo; cria Combinado com texto, prazo e responsável do passo.
