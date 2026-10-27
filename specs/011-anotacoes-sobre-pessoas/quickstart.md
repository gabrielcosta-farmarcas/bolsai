# Quickstart: validar Anotações

Pré-requisito: Docker aberto e `docker compose up -d --build --wait` com os três serviços saudáveis; entrar por http://localhost:3000.

1. **Anotar**: abrir uma pessoa → aba Anotações → "Nova anotação" (Combinado não cumprido, descrição, hoje) → salvar. Aparece no topo.
2. **Combinados**: abrir a anotação → "Adicionar combinado" (um com prazo vencido, um para "A pessoa") → ambos aparecem na anotação e na aba Combinados da pessoa; marcar um como feito; o atrasado fica destacado.
3. **Filtros**: criar mais 2 anotações, resolver uma; conferir as contagens de Todas, Abertas e Resolvidas.
4. **Cancelar**: "Cancelar combinado" na anotação → some dali e fica cancelado em Combinados.
5. **Encontro**: "Levar para o próximo encontro" → aba Preparar 1:1 mostra a anotação; marcar resolvida → some de lá.
6. **Privacidade**: com outra líder (ou chamando a API com outro usuário), as anotações respondem 404.
7. **Excluir**: excluir com confirmação; a anotação some da lista.

Testes automáticos: `npm test` na API (service, acesso) e testes de componente da tela; rotas de integração conforme `backend/node/vitest.integration.config.ts`.
