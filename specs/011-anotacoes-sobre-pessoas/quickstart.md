# Quickstart: validar Anotações

Pré-requisito: Docker aberto e `docker compose up -d --build --wait` com os três serviços saudáveis; entrar por http://localhost:3000.

1. **Anotar**: abrir uma pessoa → aba Anotações → "Nova anotação" (Combinado não cumprido, descrição, hoje) → salvar. Aparece no topo como "Sem plano ainda".
2. **Plano**: abrir a anotação → adicionar 3 passos (um com prazo vencido) → situação vira "Plano em andamento"; marcar 1 como feito → "1 de 3 feitos"; passo vencido destacado.
3. **Filtros**: criar mais 2 anotações; conferir as contagens e cada filtro.
4. **Combinado**: no passo, "Virar combinado" → aba Combinados da pessoa mostra o novo item; repetir não duplica.
5. **Encontro**: "Levar para o próximo encontro" → aba Preparar 1:1 mostra a anotação; marcar resolvida → some de lá.
6. **Privacidade**: com outra líder (ou chamando a API com outro usuário), as anotações respondem 404.
7. **Excluir**: excluir com confirmação; a anotação some da lista.

Testes automáticos: `npm test` na API (service, situação, acesso) e testes de componente da tela; rotas de integração conforme `backend/node/vitest.integration.config.ts`.
