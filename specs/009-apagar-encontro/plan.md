# Plano: Apagar um encontro

Spec: [spec.md](spec.md). Constitution check: stack padrão mantida; sem tabela nova, sem migration (nenhuma mudança de schema); tudo roda no Docker; transcrição nunca vai para log.

## Decisões técnicas

| Escolha | Por quê |
| --- | --- |
| Exclusão **física** numa transação: combinados do encontro → análises → encontro | Pedido da líder (dado sensível sumir de vez). O banco não apaga em cascata, então a ordem é explícita; a transação garante tudo-ou-nada (FR-003). |
| Resumo, evolução, perguntas, feedback e notas privadas vivem dentro da análise (`raw_json`/`reviewed_json`); apagar as análises os remove | Não há tabelas separadas para eles. |
| Só combinados com `origin_session_id` = este encontro são apagados | Combinados de outros encontros permanecem, como combinado na spec. |
| API: `DELETE /api/v1/sessions/:id` → 204; 404 `SESSION_NOT_FOUND` se não for da líder, já apagado ou pessoa excluída | Segue o padrão de `DELETE /direct-reports/:id`. |
| Análise ainda rodando quando o encontro some: o resultado é descartado (a gravação falha sem criar nada) e só entra uma linha de aviso no log, sem conteúdo | Não recria dado apagado. |
| Tela: botão "Apagar encontro" (discreto, no cabeçalho do encontro) + `ConfirmDialog` existente; ao confirmar, volta para `/pessoas/:id` e limpa os caches do encontro | Reaproveita o padrão da exclusão de pessoa; sem componente novo. Texto segue BRAND.md. |
| Aviso "Encontro apagado" na volta à página da pessoa, via estado de navegação | FR-006; mesmo mecanismo já usado em `analysisError`. |
| Testes: unitário do service (regra de posse/404), integração HTTP (some tudo, outro líder recebe 404, combinado de outro encontro fica) e de tela (diálogo, cancelar, confirmar) | Constituição: regra coberta por teste. |

## Estrutura

- `backend/node/src/modules/sessions/` (service, repository, controller, routes + testes)
- `frontend/react/src/features/sessions/` (hook `useDeleteSession`, botão com diálogo) e `app/SessionPage.tsx`, `app/DirectReportPage.tsx` (aviso)
