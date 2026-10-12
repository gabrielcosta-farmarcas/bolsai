# Golden Path — ambiente local via Docker

Quem usa este projeto pode não ser desenvolvedor. Explique em linguagem simples, sem jargão, e faça você mesmo os comandos em vez de pedir que a pessoa rode no terminal.

@AGENTS.md

O `AGENTS.md` acima é o mapa: ele diz qual guia e qual skill abrir para tela, API, banco e ambiente. As skills também estão registradas em `.claude/skills/` (atalhos para as pastas de cada área).

## Guias
Antes de mexer em Docker, leia `infrastructure/docker/DOCKER.md` e a skill do assunto:
- Subir, parar e diagnosticar: `infrastructure/docker/skills/local-environment/SKILL.md`
- Dockerfile e Compose: `infrastructure/docker/skills/containerization/SKILL.md`

Atalhos: `/subir-ambiente` e `/parar-ambiente`.

## Identidade visual
Todo texto, cor, fonte, logo e componente de tela segue `frontend/BRAND.md` (Bonsai, direção "Camadas"). Tokens só em `frontend/react/src/styles/tokens.css`; logo só pelo componente `<Logo />`. O que não estiver coberto, pergunte antes de criar.

## Spec Kit é obrigatório
Para criar uma aplicação ou funcionalidade nova, **não escreva código antes de passar pelo Spec Kit**: `specify` → `plan` → `tasks` → `implement`, pedindo aprovação da pessoa ao fim de cada etapa. Leia `SPECKIT.md` e as regras em `.specify/memory/constitution.md`. Decisões técnicas são do agente (avise o que escolheu e por quê, em linguagem simples). Perguntas só de negócio, no máximo 2 por etapa.
- Se a pessoa não digitou os comandos `/speckit-*`, conduza você mesmo: leia o `SKILL.md` da etapa em `.claude/skills/speckit-<etapa>/` e siga.
- Única exceção: correção pequena em algo que já existe (texto, cor, bug simples).

## Pré-requisito
- Docker Desktop instalado e aberto.

## Antes de qualquer coisa
1. Rode `docker info`.
2. Se falhar, o Docker Desktop não está aberto: rode `open -a Docker` (macOS), aguarde ~30s e tente `docker info` de novo.
3. Se o Docker não estiver instalado, oriente a pessoa a baixar em https://www.docker.com/products/docker-desktop/ e pare por aí.

## Subir o ambiente
- Se não existir `.env`, rode `cp .env.example .env`.
- `docker compose up -d --build --wait`
- Confira com `docker compose ps` que os três serviços estão `healthy`.
- Informe à pessoa a URL de acesso (ex.: http://localhost:3000).

## Problemas comuns
- Ver erros: `docker compose logs --tail=100 <serviço>`
- Reiniciar: `docker compose restart <serviço>` (também reinstala dependências novas sozinho)
- Parar tudo: `docker compose down`
- Porta ocupada: avise qual porta e qual programa a usa, e mude a porta no `.env` (`POSTGRES_PORT`, `API_PORT`, `WEB_PORT`) em vez de parar o outro programa.

## Nunca faça sem pedir confirmação explícita
- `docker compose down -v`, `docker volume rm`, `docker system prune`, `prisma migrate reset` — apagam dados do banco local.
