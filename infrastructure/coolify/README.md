# Bonsai no Coolify

Endereço: **https://bonsai.coolify.radar.farmarcas.com.br/**. O Bonsai roda como um único serviço Docker Compose (`docker-compose.coolify.yml`, na raiz): `web` (nginx, serve a tela e encaminha `/api`), `api` e `postgres` (rede interna, sem porta aberta). Spec: `specs/008-hospedagem-coolify/`.

> Cenário atual: só a dona do projeto usa, **com conversas fictícias**. Antes de entrarem conversas reais de outras pessoas, faltam as proteções da Fase 3 (cifrar conversas, apagar de verdade, registro de acesso, aviso às pessoas) e a avaliação do jurídico.

## Antes de começar
- DNS: `bonsai.coolify.radar.farmarcas.com.br` apontando para o servidor do Coolify.
- O Coolify precisa ler o repositório `gabrielcosta-farmarcas/bolsai` no GitHub (GitHub App ou deploy key, se o repositório for privado).
- Acesso de administrador ao Keycloak (reino `bonsai`).

## 1. Keycloak: cadastrar os endereços da hospedagem
Painel do Keycloak → reino **bonsai** → **Clients** → **bonsai-web** → **Settings**. **Acrescente** (sem apagar os de localhost):

| Campo | Valor a acrescentar |
| --- | --- |
| Valid redirect URIs | `https://bonsai.coolify.radar.farmarcas.com.br/api/v1/auth/callback` |
| Valid post logout redirect URIs | `https://bonsai.coolify.radar.farmarcas.com.br/login` |
| Web origins | `https://bonsai.coolify.radar.farmarcas.com.br` |
| Backchannel logout URL (opcional) | `https://bonsai.coolify.radar.farmarcas.com.br/api/v1/auth/backchannel-logout` (e *Backchannel logout session required* ligado) |

Salve. O mesmo cliente serve ao ambiente local e à hospedagem.

## 2. Gerar a chave de cifra (nova, só para a hospedagem)
```bash
openssl rand -base64 32
```
Guarde uma cópia em lugar seguro. **Se ela mudar**, as sessões abertas e as chaves de API salvas deixam de abrir (é só entrar e cadastrar a chave de novo).

## 3. Coolify: criar o serviço
1. **Projects** → seu projeto/ambiente → **+ New** → **Docker Compose Empty**/**Git Repository** (a opção que lê um repositório e usa um arquivo Compose).
2. Repositório `gabrielcosta-farmarcas/bolsai`, branch `main`, **Build Pack: Docker Compose**, **Docker Compose Location**: `/docker-compose.coolify.yml`.
3. Aba **Domains** (do serviço `web`): `https://bonsai.coolify.radar.farmarcas.com.br`, na porta **8080**.
4. **Environment Variables**: cadastre
   - `KEYCLOAK_CLIENT_SECRET`: painel do Keycloak → Clients → bonsai-web → Credentials → *Client secret*.
   - `SESSION_ENCRYPTION_KEY`: o valor do passo 2.
   - As variáveis `SERVICE_USER_POSTGRES` e `SERVICE_PASSWORD_POSTGRES` o **Coolify gera sozinho**.
   - As demais têm padrão no Compose (`.env.coolify.example` lista todas).
5. Em **Advanced**, deixe ligado o redeploy automático por commit na `main` se quiser (opcional).
6. **Deploy**.

## 4. Conferir
1. Abra https://bonsai.coolify.radar.farmarcas.com.br/ → deve aparecer a tela de entrada, com cadeado.
2. Clique para entrar → login do Keycloak → volta ao Bonsai logada. **A primeira pessoa a entrar com o papel `lider` vira a dona dos dados**: faça você a primeira entrada.
3. Em **Configurações**, cadastre a sua chave do Claude e escolha o modelo.
4. Cadastre uma pessoa fictícia, registre um encontro, analise e copie o resumo.

## Atualizar
Commit na `main` → no Coolify, **Redeploy** (ou automático). O banco é atualizado sozinho antes de a API subir; se a migration falhar, a versão nova não sobe e a anterior continua no ar. Os dados ficam no volume `postgres_data`.

## Voltar atrás
- Reverta o commit na `main` (`git revert`) e republique. Atenção: **migrations só andam para a frente**; se a versão com defeito criou ou alterou tabelas, restaure o backup em vez de só voltar o código.

## Backup e restauração (testar uma vez)
- No serviço, veja se existe a aba **Backups** para o `postgres`. Se existir, agende um backup e **envie para um destino fora do servidor** (S3). Se não existir, use **Scheduled Tasks** com `pg_dump` e copie o arquivo para fora do servidor: backup no mesmo disco não protege de perda do servidor.
- Teste de restauração (num banco vazio de teste):
  ```bash
  pg_restore -U <usuario> -d <banco_de_teste> --clean --if-exists arquivo.dump
  ```
- Confirme que pessoas e encontros voltaram.

## Problemas comuns
| Sintoma | Causa provável |
| --- | --- |
| Login volta com erro do Keycloak ("invalid redirect") | O endereço do passo 1 não foi cadastrado, ou tem diferença (barra, http/https). |
| A API não sobe e o log diz "Faltam variáveis de segurança" | `KEYCLOAK_CLIENT_SECRET` ou `SESSION_ENCRYPTION_KEY` não cadastradas. |
| "Muitas tentativas" para todo mundo | `TRUST_PROXY` não bate com o número de proxies na frente (aqui são 2: Coolify e nginx). Ajuste a variável. |
| Tela em branco ou 502 | O serviço `api` ainda está subindo ou não ficou saudável: veja o log da API. |
| Sessão cai depois de um deploy | A `SESSION_ENCRYPTION_KEY` mudou. |
