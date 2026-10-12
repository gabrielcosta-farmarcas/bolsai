# Golden Path — orquestrador de criação de aplicação

Este arquivo é a porta de entrada. Quando a pessoa pedir para criar ou evoluir uma aplicação, leia este mapa, identifique quais contextos o pedido toca e abra somente esses caminhos.

Uma skill é o procedimento de uma atividade. O guia da pasta é a política daquela tecnologia. Leia o guia antes da skill. A skill diz o que fazer; o guia diz as regras que a skill aplica.

Carregue o contexto que o pedido exige. Pedido de tela abre o frontend. Pedido de endpoint abre o backend do runtime escolhido. Pedido de tabela abre o banco. Pedido para subir o ambiente abre o Docker. Os demais contextos ficam fechados.

## Como decidir

1. Leia o pedido e liste os contextos envolvidos: interface, API, banco, ambiente local.
2. Se o repositório consumidor já tiver stack, preserve o que está lá.
3. Se for aplicação nova e a pessoa não escolher stack, use o padrão abaixo.
4. Abra o guia do contexto e, em seguida, a skill da atividade.
5. Siga os passos da skill na ordem e feche o checklist dela antes de encerrar.
6. Se o pedido sair do que a skill cobre, informe a lacuna. Não invente padrão de outra tecnologia.

### Padrão quando ninguém escolhe a stack

| Parte | Padrão | Só muda se |
| --- | --- | --- |
| Interface | React | A pessoa pedir outra interface, ou o projeto já usar outra |
| API | Node.js + TypeScript | A pessoa pedir Python, ou o projeto já for Python |
| Banco | PostgreSQL | O requisito for explicitamente não relacional |
| Ambiente local | Docker Compose | — |

Um serviço usa um runtime. Node e Python não convivem no mesmo serviço. Ofereça comparação de stack somente quando a pessoa pedir.

Quem pede pode não ser desenvolvedor. Explique em linguagem simples, curto, e execute os comandos você mesmo. Não pergunte stack: use o padrão (ou o que o projeto já tem), diga o que escolheu e por quê. Perguntas só de negócio. No Spec Kit, siga `SPECKIT.md`.

## Ordem sugerida ao montar uma aplicação inteira

Esta ordem é um caminho, não uma lista obrigatória. Pule a etapa cujo contexto o pedido não tem.

1. **Banco** — modelar e versionar o schema, quando houver dados persistidos.
2. **API** — contrato HTTP, módulos e testes da regra de negócio, quando houver backend.
3. **Interface** — estrutura da tela e, se houver visual, Tailwind.
4. **Ambiente** — Dockerfiles e Compose, quando o projeto precisar rodar em container.
5. **Subir** — somente quando a pessoa pedir para rodar, ou quando a entrega incluir o ambiente no ar.

Schema, migration e seed nascem nas skills de banco. A skill de API consome o banco; ela não substitui `schema-design`, `migrations` nem `seed-data`.

## Interface — React

Guia: `frontend/FRONTEND.MD`  
Identidade visual obrigatória (Bonsai, "Camadas"): `frontend/BRAND.md`  
Contexto extra: `frontend/README.md`

Abra este contexto ao criar ou alterar tela, componente, página, hook, estado ou visual.

| Atividade | Skill | Abra quando | Pule quando |
| --- | --- | --- | --- |
| Estrutura, componente, página, hook, estado, props, acessibilidade | `frontend/react/skills/component-development/SKILL.md` | Criar ou alterar página, feature, componente ou hook; extrair JSX; colocar dados ou regra na UI | O pedido for só cor, espaçamento, `className` ou variante visual |
| Tailwind, token, `className`, variante, primitivo visual | `frontend/react/skills/styling-tailwind/SKILL.md` | Escrever classe, cor, espaçamento, tipografia ou primitivo em `components/ui` | O pedido for só estrutura, estado ou dados, sem mudança visual |

Tela ou componente novo: leia `component-development` e, em seguida, `styling-tailwind`.

## API — Backend

Guia: `backend/BACKEND.md`  
Contexto extra: `backend/README.md`

Abra este contexto ao criar ou alterar endpoint, CRUD, service, validação, integração com PostgreSQL, teste da API ou Dockerfile do backend.

Escolha um runtime e carregue só as skills dele:

- Projeto existente: o runtime que já está no repositório.
- Projeto novo com runtime informado: o runtime pedido.
- Projeto novo sem runtime: Node.js.

| Atividade | Skill | Abra quando | Pule quando |
| --- | --- | --- | --- |
| API REST em Node (rota, controller, service, repository, Zod, Prisma, teste HTTP, Docker do serviço) | `backend/node/skills/api-development/SKILL.md` | Criar ou alterar endpoint, CRUD, módulo, validação, Prisma, logs, erro, paginação, health ou Dockerfile Node | O backend for Python |
| Teste unitário da regra de negócio em Node (Vitest, TDD) | `backend/node/skills/testing/SKILL.md` | Alterar service, helper puro ou regra de domínio; a pessoa pedir teste unitário ou TDD | O arquivo for só rota, controller, repository Prisma ou schema Zod sem regra; o teste for HTTP com Supertest (isso fica em `node-api-development`) |
| API REST em Python (router, service, repository, Pydantic, SQLAlchemy, httpx, pytest do service, Docker do serviço) | `backend/python/skills/api-development/SKILL.md` | A pessoa pedir backend em Python, ou o projeto já for Python | O backend for Node |

Em Node, endpoint com regra de negócio abre as duas skills: `node-api-development` define contrato e arquitetura; `node-unit-testing` cobre o service. Teste de integração HTTP permanece em `node-api-development`.

Em Python, regra e teste unitário do service já estão em `python-api-development`. Não existe skill separada de teste Python.

Contrato HTTP é o mesmo nos dois runtimes: `/api/v1`, recurso no plural, erro `{ error: { code, message, details } }`, listagem paginada, `/health` e `/health/ready`.

Estas skills não cobrem migration, DDL, autenticação, JWT, CORS, rate limit nem auditoria de dependências. Migration vai para o contexto de banco. Segurança HTTP ainda não tem skill: informe a lacuna.

Esqueleto de referência Node (TypeScript + Prisma), que já roda no Compose desta raiz: `backend/node`. Cópia para levar a outros projetos: `templates/backend/node` (gerada por `scripts/sync-templates.sh`; não edite à mão).

## Banco — PostgreSQL

Guia: `database/DATABASE.md`  
Contexto extra: `database/README.md`

Abra este contexto ao criar ou alterar banco, tabela, chave, índice, migration, seed ou compose de dados, e ao modelar dado pessoal, exclusão ou retenção.

| Atividade | Skill | Abra quando | Pule quando |
| --- | --- | --- | --- |
| Modelar entidades, tabelas, chaves, índices e revisão de schema | `database/postgres/skills/schema-design/SKILL.md` | Desenhar ou revisar o modelo (3NF, PK, soft delete, LGPD) | A tabela já estiver modelada e o trabalho for só escrever ou aplicar o arquivo de migration |
| Criar e aplicar migrations SQL versionadas | `database/postgres/skills/migrations/SKILL.md` | Evoluir schema, escrever SQL versionado ou aplicar migration no Postgres local | Ainda não houver modelo; nesse caso abra `schema-design` antes |
| Popular o banco com dados de exemplo (perguntas de negócio + SQL em `seeds/`) | `database/postgres/skills/seed-data/SKILL.md` | Seed, fixtures, massa para demo/teste local, “dados de exemplo” | Schema ainda não existir (abra `schema-design` / `migrations` antes); pedido for dump ou dado real de produção |

Leia `DATABASE.md` antes das skills de banco. PostgreSQL é o banco relacional padrão (`postgres:16-alpine` no Compose).

Em projeto Node, o modelo mora em `prisma/schema.prisma` e as migrations são geradas pelo Prisma Migrate (seção "Migrations com Prisma" do `DATABASE.md`). Schema novo: `schema-design` e depois `migrations`. Mudança em tabela que já existe: `migrations`, respeitando a PK já escolhida. Dados de exemplo: `seed-data` depois do schema (e migrations) existirem.

## Ambiente local — Docker

Guia: `infrastructure/docker/DOCKER.md`  
Contexto extra: `infrastructure/docker/README.md` e `CLAUDE.md`

Abra este contexto ao criar Dockerfile, Compose ou `.env.example`, ou ao subir, parar e diagnosticar o ambiente. Arquivos de referência para copiar: `templates/docker` (cópia gerada dos arquivos da raiz; a fonte da verdade é a raiz).

| Atividade | Skill | Abra quando | Pule quando |
| --- | --- | --- | --- |
| Dockerfile, `docker-compose.yml`, `.env.example`, portas, volumes, healthcheck | `infrastructure/docker/skills/containerization/SKILL.md` | Containerizar serviço, alterar Compose ou criar variáveis de ambiente | O Compose já existir e o pedido for só ligar, desligar ou ver erro |
| Subir, parar, reiniciar e diagnosticar | `infrastructure/docker/skills/local-environment/SKILL.md` | "Sobe o projeto", "para tudo", serviço fora do ar, porta ocupada, ver logs | O pedido for só escrever Dockerfile ou Compose, sem rodar |

Atalhos equivalentes à skill `local-environment`: `/subir-ambiente` e `/parar-ambiente`.

`containerization` entrega os arquivos. `local-environment` coloca o ambiente no ar e confere saúde. Ao containerizar do zero, faça as duas nessa ordem.

`docker compose down -v`, `docker volume rm` e `docker system prune` apagam o banco local. Explique a perda e peça confirmação explícita antes de qualquer um deles.

## Lacunas conhecidas

Estes assuntos ainda não têm procedimento. Se o pedido depender deles, diga isso em vez de improvisar:

- Autenticação, JWT, senha, CORS, rate limit e auditoria de dependências.
- Teste de rota Python com banco (TestClient). O teste unitário do service Python continua em `python-api-development`.
- Banco não relacional.
- Imagem de produção, registry e orquestração fora da máquina local.
