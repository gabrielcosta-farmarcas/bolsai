# Feature Specification: Anotações sobre pessoas

**Feature Branch**: `main` (sem branch própria, como as specs anteriores)
**Created**: 2026-10-27
**Status**: Draft
**Input**: "No Bonsai, eu gostaria de ter um lugar para colocar feedback para os colaboradores. Eu tenho um Luzinaldo como coordenador, eu pedi pra ele fazer algo e ele esqueceu, eu gostaria de anotar isso em um lugar para pensar em um plano de ação." Tela proposta e aprovada na conversa (aba "Anotações" na página da pessoa).

Convive com Encontros e Combinados (specs 001 e 004). Não altera o responsograma.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Anotar o que aconteceu (Priority: P1)

Na página de uma pessoa, a líder abre a aba **Anotações** e registra algo que aconteceu: uma descrição, o tipo (**Combinado não cumprido**, **Ponto de atenção** ou **Elogio**) e a data (hoje por padrão). A anotação nasce com a situação **Sem plano ainda**.

**Why this priority**: sem o registro rápido o resto não existe; é o que a líder pediu ("anotar isso em um lugar").

**Independent Test**: abrir a página de uma pessoa, criar uma anotação e vê-la na lista ao reabrir a página.

**Acceptance Scenarios**:

1. **Given** a página de uma pessoa, **When** a líder escreve a descrição, escolhe o tipo e salva, **Then** a anotação aparece no topo da lista com a data e a situação "Sem plano ainda".
2. **Given** uma descrição vazia, **When** a líder tenta salvar, **Then** o Bonsai avisa que falta descrever e não salva.
3. **Given** uma anotação já salva, **When** a líder edita a descrição, o tipo ou a data, **Then** a mudança fica guardada.
4. **Given** uma anotação feita por engano, **When** a líder a exclui e confirma, **Then** ela some da lista (e do plano que tinha).
5. **Given** a lista de anotações, **When** a líder escolhe um filtro de situação (Todas, Sem plano, Em andamento, Resolvidas), **Then** vê só as daquela situação, com a contagem de cada uma.

---

### User Story 2 - Montar um plano de ação (Priority: P1)

Dentro de uma anotação, a líder monta um **plano de ação**: uma lista de passos. Cada passo tem um texto, um prazo (opcional) e um responsável (opcional; por padrão, ela mesma). Ela marca cada passo como feito e vê o progresso ("1 de 3 feitos"). A situação da anotação acompanha o plano: com ao menos um passo, vira **Plano em andamento**; ela mesma marca como **Resolvida** quando quiser.

**Why this priority**: é o objetivo declarado: "pensar em um plano de ação".

**Independent Test**: criar uma anotação, adicionar três passos, marcar um como feito, ver "1 de 3 feitos" e a situação "Plano em andamento"; marcar a anotação como resolvida e vê-la no filtro Resolvidas.

**Acceptance Scenarios**:

1. **Given** uma anotação sem plano, **When** a líder adiciona o primeiro passo, **Then** a situação muda para "Plano em andamento".
2. **Given** um plano com passos, **When** a líder marca um passo como feito, **Then** o progresso se atualiza e o passo aparece riscado com a data de conclusão.
3. **Given** um passo, **When** a líder edita o texto, o prazo ou o responsável, ou o remove, **Then** o plano reflete a mudança.
4. **Given** um plano com todos os passos feitos, **When** a líder abre a anotação, **Then** o Bonsai sugere marcá-la como resolvida, mas não resolve sozinho.
5. **Given** uma anotação resolvida, **When** a líder a reabre, **Then** ela volta para "Plano em andamento" (ou "Sem plano ainda", se não tiver passos).
6. **Given** um passo com prazo vencido e ainda não feito, **When** a líder vê o plano, **Then** o prazo aparece destacado com tom de atenção (sem cobrança).

---

### User Story 3 - Levar para o encontro e virar Combinado (Priority: P2)

O plano é só da líder. Quando ela conversa com a pessoa e o acerto fica aberto aos dois, ela **promove um passo a Combinado**: o Bonsai cria um Combinado daquela pessoa com o texto e o prazo do passo, e o passo passa a mostrar que virou combinado. Ela também pode **levar a anotação para o próximo encontro**, e ela aparece como lembrete na preparação do 1:1 daquela pessoa.

**Why this priority**: fecha o ciclo anotação → conversa → compromisso, mas as histórias 1 e 2 já têm valor sozinhas.

**Independent Test**: promover um passo e ver o Combinado novo na lista de Combinados da pessoa; levar uma anotação ao encontro e vê-la na preparação do 1:1.

**Acceptance Scenarios**:

1. **Given** um passo de um plano, **When** a líder escolhe "Virar combinado", **Then** surge um Combinado da pessoa com o texto e o prazo do passo, e o passo mostra a etiqueta "Combinado".
2. **Given** um passo que já virou combinado, **When** a líder tenta promovê-lo de novo, **Then** o Bonsai não cria um segundo Combinado.
3. **Given** uma anotação, **When** a líder escolhe "Levar para o próximo encontro", **Then** ela aparece na preparação do 1:1 daquela pessoa, com a descrição e os passos em aberto.
4. **Given** uma anotação já resolvida, **When** a líder abre a preparação do 1:1, **Then** ela não aparece como lembrete.

---

### Edge Cases

- Pessoa sem nenhuma anotação: a aba mostra um convite ("Registre o primeiro ponto…"), não uma tela vazia ou pedido de desculpas.
- Descrição muito longa: o Bonsai avisa quanto passou do limite e não salva.
- Pessoa desligada ou excluída: suas anotações deixam de aparecer junto com ela (mesma regra de exclusão lógica do restante do app).
- Outra pessoa que acesse o Bonsai (outra líder, ou a própria pessoa anotada): nunca vê estas anotações.
- Passo promovido a Combinado e depois o Combinado é apagado ou concluído: o passo continua no plano com a etiqueta, sem apagar nada do plano.
- Prazo no passado ao criar: permitido (a líder pode registrar algo já atrasado), sem bloquear.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A página de cada pessoa MUST ter uma aba "Anotações" ao lado de Encontros e Combinados.
- **FR-002**: A líder MUST poder criar, editar e excluir anotações de uma pessoa, com descrição (obrigatória), tipo (Combinado não cumprido, Ponto de atenção, Elogio) e data (hoje por padrão).
- **FR-003**: Cada anotação MUST ter uma situação: "Sem plano ainda", "Plano em andamento" ou "Resolvida".
- **FR-004**: A situação MUST mudar para "Plano em andamento" ao adicionar o primeiro passo e voltar para "Sem plano ainda" se o último passo for removido; "Resolvida" só por ação da líder, que também pode reabrir.
- **FR-005**: Uma anotação MUST poder ter um plano de ação com vários passos; cada passo tem texto (obrigatório), prazo (opcional), responsável (opcional, padrão: a líder) e estado feito/não feito com a data de conclusão.
- **FR-006**: A lista MUST mostrar as anotações da mais recente para a mais antiga, com filtros por situação e contagem de cada uma.
- **FR-007**: O plano MUST mostrar o progresso ("N de M feitos") e destacar, com tom de atenção, passos com prazo vencido e não feitos.
- **FR-008**: A líder MUST poder promover um passo a Combinado da pessoa (texto e prazo copiados), sem duplicar se o passo já foi promovido.
- **FR-009**: A líder MUST poder levar uma anotação em aberto para o próximo encontro, e ela MUST aparecer na preparação do 1:1 da pessoa enquanto não estiver resolvida.
- **FR-010**: As anotações e planos MUST ser visíveis somente à líder dona da pessoa: nunca à própria pessoa nem a outras líderes.
- **FR-011**: Excluir uma anotação MUST pedir confirmação e MUST seguir a regra de exclusão lógica do projeto (nada é apagado de fato).
- **FR-012**: Todo texto da tela MUST seguir a identidade e o tom do Bonsai (`frontend/BRAND.md`): sereno e direto, sem "cobrança", "desempenho", "nota" ou "monitorar".

### Key Entities

- **Anotação**: algo que aconteceu com uma pessoa. Tem descrição, tipo, data, situação e pertence a uma pessoa e à líder que a registrou.
- **Passo do plano**: uma ação dentro de uma anotação. Tem texto, prazo, responsável, estado feito/não feito e, se foi o caso, o Combinado que gerou.
- **Combinado** (já existe): compromisso acertado com a pessoa num encontro; o passo promovido cria um.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A líder registra uma anotação em menos de 1 minuto, a partir da página da pessoa.
- **SC-002**: A líder monta um plano de 3 passos em menos de 3 minutos.
- **SC-003**: Em teste com 5 anotações em situações variadas, a líder encontra as que estão sem plano em até 2 cliques.
- **SC-004**: 100% das anotações e planos ficam invisíveis para quem não é a líder dona (verificado com um segundo usuário).
- **SC-005**: Promover um passo a Combinado leva até 2 cliques e o Combinado aparece na lista da pessoa imediatamente.

## Assumptions

- **Quem usa**: a líder (gestora) que já usa o Bonsai para seus encontros. Pessoas anotadas não acessam esta aba.
- **Privacidade**: visível só à líder dona da pessoa (sugestão aceita implicitamente na conversa; a pessoa anotada nunca vê).
- **Tipos**: lista curta fixa (Combinado não cumprido, Ponto de atenção, Elogio). Tipos livres ficam de fora desta versão.
- **Plano e Combinado separados**: o plano é a preparação da líder; o Combinado é o acerto compartilhado. Um passo pode ser promovido, mas passos que só a líder executa nunca viram Combinado.
- **Fora desta versão**: anexos, comentários de outras pessoas, notificações e lembretes automáticos, relatório consolidado do time, análise por IA das anotações.
- **Decision**: segue a stack e as convenções atuais do projeto (React, API Node com Prisma, Postgres) e o padrão de exclusão lógica. **Why**: é o que o projeto já usa; nenhuma tecnologia nova é necessária.
- **Decision**: "Anotações" como nome na interface, no lugar de "feedback". **Why**: o tom do Bonsai evita linguagem de avaliação e cobrança.
