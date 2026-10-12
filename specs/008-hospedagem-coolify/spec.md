# Feature Specification: Hospedagem do Bonsai no Coolify

**Feature Branch**: `main` (trabalho direto na main, a pedido do usuário)
**Created**: 2026-10-12
**Status**: Draft
**Input**: "Vamos hospedar no Coolify" no endereço `https://bonsai.coolify.radar.farmarcas.com.br/`. A pessoa abre o Coolify e o agente conduz; segredos são digitados só pela pessoa.

Cumpre a lacuna do `AGENTS.md` ("imagem de produção, registry e orquestração fora da máquina local").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O Bonsai abre no endereço da empresa (Priority: P1)

A líder abre `https://bonsai.coolify.radar.farmarcas.com.br/`, entra pelo login do Keycloak (reino `bonsai`, já com o tema Bonsai quando instalado) e usa o Bonsai normalmente: pessoas, encontros, análise, combinados, resumo e Configurações.

**Why this priority**: é o objetivo; sem isso não há hospedagem.

**Independent Test**: abrir o endereço num navegador, entrar, cadastrar uma pessoa fictícia, registrar um encontro, analisar e copiar o resumo.

**Acceptance Scenarios**:

1. **Given** o Bonsai publicado, **When** a líder abre o endereço, **Then** vê a tela de entrada do Bonsai por HTTPS, sem aviso de segurança.
2. **Given** a tela de entrada, **When** a líder entra com o Keycloak, **Then** volta ao Bonsai já logada.
3. **Given** a líder logada, **When** usa as telas e a análise por IA (com a chave dela em Configurações), **Then** tudo funciona como no ambiente local.
4. **Given** uma pessoa sem o papel de líder, **When** tenta entrar, **Then** não vê conteúdo (como hoje).
5. **Given** o endereço em `http://`, **When** alguém o abre, **Then** é levado ao `https://`.

---

### User Story 2 - Atualizar sem passos manuais (Priority: P1)

Depois de publicado, uma nova versão (commit na `main`) é colocada no ar com um clique no Coolify (ou automaticamente). O banco é atualizado sozinho (migrations) e os dados existentes são mantidos.

**Independent Test**: publicar uma mudança pequena que inclui uma migration e ver a nova versão no ar com os dados de antes intactos.

**Acceptance Scenarios**:

1. **Given** uma versão nova com migration, **When** é publicada, **Then** o banco é atualizado antes de a API aceitar pedidos, e nenhum dado é perdido.
2. **Given** uma migration que falha, **When** a publicação roda, **Then** a versão anterior continua no ar (a API nova não sobe).
3. **Given** o servidor reiniciado, **When** volta, **Then** o Bonsai volta sozinho com os mesmos dados.

---

### User Story 3 - Dados e segredos protegidos (Priority: P1)

O banco **não é acessível pela internet** (só pela API, dentro do Coolify). Nenhum segredo (senha do banco, chave de cifra, segredo do Keycloak) está no repositório; todos ficam nas variáveis do Coolify. Os dados ficam num volume que sobrevive a novas publicações, com **backup automático**.

**Independent Test**: tentar conectar ao banco pela internet (deve falhar); procurar segredos no repositório (nenhum); fazer um backup e restaurar num banco de teste.

**Acceptance Scenarios**:

1. **Given** o Bonsai no ar, **When** se tenta acessar a porta do banco de fora, **Then** a conexão não é possível.
2. **Given** o repositório, **When** é varrido, **Then** não há senha, chave nem segredo reais.
3. **Given** o backup agendado, **When** roda, **Then** gera uma cópia que consegue ser restaurada num banco vazio (testado uma vez).
4. **Given** várias pessoas acessando, **When** o limite de tentativas conta acessos, **Then** conta por pessoa de verdade (pelo endereço real de quem acessa), não tudo como se fosse um só.

---

### User Story 4 - Voltar atrás com segurança (Priority: P2)

Se uma publicação der problema, dá para voltar à versão anterior no Coolify sem perder dados.

**Acceptance Scenarios**:

1. **Given** uma versão com defeito, **When** a líder/administrador volta à anterior no Coolify, **Then** o Bonsai volta a funcionar e os dados continuam.

### Edge Cases

- A chave de cifra do servidor trocada por engano: as sessões e a chave de API guardada deixam de abrir (a líder precisa entrar e cadastrar a chave de novo). A documentação avisa para guardar essa chave.
- O Keycloak fora do ar: o Bonsai mostra que não consegue entrar agora, sem quebrar o resto.
- A análise por IA sem chave da líder: avisa o que falta (como hoje).
- Endereço do Keycloak sem o novo endereço cadastrado: o login volta com erro claro; o passo a passo inclui esse cadastro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Bonsai MUST abrir em `https://bonsai.coolify.radar.farmarcas.com.br/` com certificado válido, a tela e a API **no mesmo endereço** (a API sob `/api`).
- **FR-002**: A publicação MUST usar imagens de **produção** (sem recarga automática nem código montado da máquina), geradas a partir do repositório.
- **FR-003**: O banco MUST ser atualizado por migrations ao publicar, antes de a API atender; falha na migration MUST impedir a versão nova.
- **FR-004**: O banco MUST ficar acessível **só** para a API (rede interna do Coolify), com os dados em volume persistente.
- **FR-005**: Segredos MUST vir das variáveis do Coolify; o repositório MUST conter só valores de exemplo.
- **FR-006**: A tela MUST ser servida com os cabeçalhos de segurança de produção (sem `unsafe-inline` em scripts) e a API MUST considerar o endereço real de quem acessa (proxy confiável) para o limite de tentativas.
- **FR-007**: MUST haver verificação de saúde (tela, API e banco) e reinício automático dos serviços.
- **FR-008**: MUST haver backup agendado do banco e uma restauração testada.
- **FR-009**: O cliente `bonsai-web` do Keycloak MUST ter os endereços de produção cadastrados (retorno do login, retorno ao sair, origem e, opcionalmente, saída em todos os lugares).
- **FR-010**: MUST existir um passo a passo para o Coolify (o que criar, o que colar, em que ordem), para atualizar e para voltar atrás.
- **FR-011**: O ambiente local (`docker compose up`) MUST continuar funcionando como hoje.

### Key Entities

- **Ambiente de produção**: tela, API e banco publicados juntos, com as variáveis e o volume de dados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A líder cadastra uma pessoa fictícia, registra um encontro, analisa e copia o resumo no endereço público, sem erro.
- **SC-002**: Uma publicação de atualização com migration leva no máximo 10 minutos e mantém 100% dos dados.
- **SC-003**: A porta do banco não responde a partir da internet.
- **SC-004**: Uma varredura do repositório não encontra nenhum segredo real.
- **SC-005**: A restauração de um backup num banco vazio recupera as pessoas e encontros (testada uma vez).
- **SC-006**: Os testes anteriores continuam verdes e o ambiente local sobe normalmente.

## Assumptions

- **Cenário**: só a pessoa dona do projeto usa, **com conversas fictícias**, como definido nas specs 003 e 005. Antes de entrarem conversas reais de outras pessoas, são necessárias as proteções da Fase 3 (cifrar conversas no banco, apagar de verdade, registro de acesso, aviso às pessoas) e a avaliação do jurídico/proteção de dados da empresa. Esta spec **não** as cobre.
- **Hospedagem**: Coolify da empresa (o mesmo que roda o Keycloak), com Docker Compose publicado a partir do repositório no GitHub; HTTPS e certificado pelo próprio Coolify.
- **Chave do Claude**: continua sendo cadastrada pela líder em Configurações; não vai nas variáveis do Coolify.
- **Segredos digitados pela pessoa**: o agente **não digita segredos**. A pessoa cola `KEYCLOAK_CLIENT_SECRET` e `SESSION_ENCRYPTION_KEY` (gerada por ela). A senha do banco é gerada pelo próprio Coolify.
- **Keycloak**: o mesmo reino `bonsai` e o mesmo cliente `bonsai-web`, com os endereços de produção **acrescentados** (os locais continuam).
- Fora do escopo: vários ambientes (homologação), monitoramento e alertas, domínio próprio diferente, CI de publicação automática, as proteções da Fase 3, instalação do tema do Keycloak (spec 007, à parte).
