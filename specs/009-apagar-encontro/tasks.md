# Tarefas: Apagar um encontro

## Backend
- [x] T001 `remove` no service de sessões (404 se não visível) + teste unitário
- [x] T002 `remove` no repository: transação apagando combinados do encontro, análises e o encontro
- [x] T003 Rota `DELETE /sessions/:id` + controller (204)
- [x] T004 Teste de integração: apaga tudo do encontro, mantém combinados de outros, 404 para outro líder/já apagado
- [x] T005 Tornar `markFailed` tolerante a análise já apagada

## Frontend
- [x] T006 Hook `useDeleteSession` (limpa caches do encontro, da lista, da linha do tempo e dos combinados)
- [x] T007 Botão "Apagar encontro" + `ConfirmDialog` na `SessionPage`; ao confirmar volta para a pessoa
- [x] T008 Aviso "Encontro apagado" na página da pessoa
- [x] T009 Teste de tela: abrir, cancelar, confirmar

## Fechamento
- [x] T010 Rodar testes, lint e tipos; conferir no navegador
