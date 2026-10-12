#!/bin/sh
# Entrada do container de produção da API.
# Aplica as migrations pendentes e só então inicia o servidor: se a migration falhar, o container
# não sobe e o Coolify mantém a versão anterior no ar.
set -e

npx prisma migrate deploy
exec node dist/server.js
