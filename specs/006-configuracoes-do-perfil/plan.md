# Plano: Configurações do perfil

Spec: [spec.md](spec.md). Constitution check: stack padrão mantida (Node 22 + TS + Prisma, React + Tailwind, Postgres); mudança de banco só por migration; tudo roda no Docker; nenhum segredo no git.

## Decisões técnicas

| Escolha | Por quê |
| --- | --- |
| Tabela nova `leader_settings` (uma linha por líder: chave cifrada, 4 últimos caracteres, data da troca, modelo, prompt personalizado) | Isola por líder (FR-009) e mantém `leaders` enxuta. Migration Prisma. |
| Chave cifrada com AES-256-GCM, usando o mesmo mecanismo e a mesma `SESSION_ENCRYPTION_KEY` das sessões de login | Já existe, já é testado; evita criar segredo novo. |
| A chave é conferida com uma chamada de **listar modelos** da Anthropic antes de gravar | Não gasta tokens e prova que a chave é aceita. Injetada como dependência, para testar sem internet. |
| Lista fixa de modelos no código (`shared/ai/models.ts`) | A líder escolhe, não digita; entra modelo novo numa atualização. |
| `makeAnthropicClient` passa a receber `{apiKey, model}`; um resolvedor `resolveAiConfig(leaderId)` escolhe: configuração da líder → `.env` → "não configurado" | Mantém o padrão da instalação como reserva (FR-008). Serviços chamam `getAiClient(leaderId)`. |
| Prompt: texto da líder no banco; se vazio, arquivo `prompts/analysis-1on1.md`. Entre 200 e 30.000 caracteres | Voltar ao padrão = apagar o texto. Formato da resposta continua forçado pelo schema, independente do prompt. |
| API: `GET /settings`, `PUT/DELETE /settings/api-key`, `PUT /settings/model`, `PUT/DELETE /settings/prompt` (só papel `lider`, já coberto pelo bloqueio padrão) | Um recurso, ações pequenas. A chave nunca sai nas respostas. |
| Tela `/configuracoes` (item "Configurações" no menu), feature `features/settings` | Segue BRAND.md e os componentes `ui/` existentes. |
| Logs: nada de chave nem texto do prompt (só tipo de erro) | FR-011. |

## Estrutura

- `backend/node/src/modules/settings/` (schemas, repository, service, routes, testes)
- `backend/node/src/shared/ai/` (`models.ts`, `resolve-ai-config.ts`, cliente com config explícita)
- `frontend/react/src/features/settings/` e `app/SettingsPage.tsx`
