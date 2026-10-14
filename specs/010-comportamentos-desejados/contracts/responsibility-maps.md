# Contratos alterados

Todos os campos novos são opcionais; quem não envia continua funcionando.

- `POST /api/v1/direct-reports` — corpo ganha `behaviors?: string` (até 3.000), gravado na versão 1.
- `POST /api/v1/direct-reports/:id/responsibility-maps` — corpo ganha `behaviors?: string` (até 3.000); nova versão. Vazio ou só espaços = `null`.
- `GET` do responsograma vigente e do histórico de versões — cada versão devolve `behaviors: string | null`.
- Erro de tamanho: o formato padrão `{ error: { code, message, details } }` com `code: "validation_error"`.

**Entrada da IA** (interna): `<responsograma>` ganha, após `</responsabilidades>`, `<comportamentos_desejados>…</comportamentos_desejados>` só quando há texto.
