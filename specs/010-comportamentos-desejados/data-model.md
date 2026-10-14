# Data Model

**ResponsibilityMap** (`responsibility_maps`), já existente — ganha:

| Campo | Tipo | Regras |
| --- | --- | --- |
| `behaviors` | texto, anulável | Opcional. Aparado nas pontas; vazio vira `null`. Máximo 3.000 caracteres. Vale para a versão em que foi salvo. |

- Migration só adiciona a coluna (`ADD COLUMN "behaviors" TEXT`); linhas antigas ficam `null`. Sem backfill, sem alteração de outras colunas.
- Sem nova entidade e sem mudança em `responsibilities` (as responsabilidades continuam por chave do texto).
- Dado sensível como a missão: não vai para log nem para a exportação do resumo.
