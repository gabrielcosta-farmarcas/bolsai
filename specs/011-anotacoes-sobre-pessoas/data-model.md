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

## `agreements` (existente) — coluna nova
| Campo | Tipo | Regra |
| --- | --- | --- |
| note_id | uuid? | FK notes; preenchido = combinado nascido de uma anotação |

Índice: `(note_id)`. A anotação mostra só os combinados dela que não estão cancelados.

## Situação (calculada, não guardada)
- `resolved_at` não nulo → `resolved`; senão → `open`.

## Regras de transição
- Resolver: grava `resolved_at`, zera `bring_to_next_session`. Reabrir: limpa `resolved_at`.
- Combinado atrasado: aberto e `due_date` anterior a hoje (calculado na resposta).
- Criar combinado na anotação: `origin = leader`, aberto, confirmado na hora, da pessoa da anotação.

## Histórico
A primeira versão tinha a tabela `note_steps` (passos do plano). A migration `notes_use_agreements` converteu cada passo em combinado ligado à anotação e removeu a tabela.
