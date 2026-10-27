# Feature Specification: Anotações sobre pessoas

**Feature Branch**: `main` (sem branch própria, como as specs anteriores)
**Created**: 2026-10-27
**Status**: Implementada (revisada em 2026-10-27: passos viraram combinados)
**Input**: "No Bonsai, eu gostaria de ter um lugar para colocar feedback para os colaboradores. Eu tenho um Luzinaldo como coordenador, eu pedi pra ele fazer algo e ele esqueceu, eu gostaria de anotar isso em um lugar para pensar em um plano de ação." Tela proposta e aprovada na conversa (aba "Anotações" na página da pessoa).

Convive com Encontros e Combinados (specs 001 e 004). Não altera o responsograma.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Anotar o que aconteceu (Priority: P1)

Na página de uma pessoa, a líder abre a aba **Anotações** e registra algo que aconteceu: uma descrição, o tipo (**Combinado não cumprido**, **Ponto de atenção** ou **Elogio**) e a data (hoje por padrão). A anotação nasce **Aberta**.

**Why this priority**: sem o registro rápido o resto não existe; é o que a líder pediu ("anotar isso em um lugar").

**Independent Test**: abrir a página de uma pessoa, criar uma anotação e vê-la na lista ao reabrir a página.

**Acceptance Scenarios**:

1. **Given** a página de uma pessoa, **When** a líder escreve a descrição, escolhe o tipo e salva, **Then** a anotação aparece no topo da lista com a data.
2. **Given** uma descrição vazia, **When** a líder tenta salvar, **Then** o Bonsai avisa que falta descrever e não salva.
3. **Given** uma anotação já salva, **When** a líder edita a descrição, o tipo ou a data, **Then** a mudança fica guardada.
4. **Given** uma anotação feita por engano, **When** a líder a exclui e confirma, **Then** ela some da lista (os combinados criados a partir dela continuam em Combinados).
5. **Given** a lista de anotações, **When** a líder escolhe um filtro (Todas, Abertas, Resolvidas), **Then** vê só as daquela situação, com a contagem de cada uma.
6. **Given** uma anotação aberta, **When** a líder a marca como resolvida (ou reabre), **Then** a situação muda e o filtro reflete isso.

---

### User Story 2 - Decidir o que fazer: combinados da anotação (Priority: P1)

Dentro de uma anotação, a líder cria **combinados**: o que fazer a respeito. Cada um tem texto, prazo (opcional) e responsável (ela ou a pessoa). São Combinados de verdade: aparecem na anotação e na aba **Combinados** da pessoa, sem copiar nem promover nada. Ela marca cada um como feito na própria anotação e pode cancelá-lo.

**Why this priority**: é o objetivo declarado: "pensar em um plano de ação", sem um segundo conceito para aprender.

**Independent Test**: criar uma anotação, adicionar dois combinados (um com prazo vencido), marcar um como feito, e ver os dois na aba Combinados da pessoa.

**Acceptance Scenarios**:

1. **Given** uma anotação, **When** a líder adiciona um combinado, **Then** ele aparece na anotação e na aba Combinados da pessoa.
2. **Given** um combinado da anotação, **When** a líder o marca como feito (ou desmarca), **Then** o estado muda também na aba Combinados.
3. **Given** um combinado da anotação, **When** a líder o cancela, **Then** ele some da anotação e fica cancelado em Combinados.
4. **Given** combinados todos feitos, **When** a líder abre a anotação, **Then** o Bonsai sugere marcá-la como resolvida, mas não resolve sozinho.
5. **Given** um combinado com prazo vencido e ainda aberto, **When** a líder vê a anotação, **Then** ele aparece com tom de atenção (sem cobrança).

---

### User Story 3 - Levar para o encontro (Priority: P2)

A líder pode **levar a anotação para o próximo encontro**, e ela aparece como lembrete na preparação do 1:1 daquela pessoa, com a descrição e os combinados ainda abertos.

**Why this priority**: fecha o ciclo anotação → conversa, mas as histórias 1 e 2 já têm valor sozinhas.

**Independent Test**: levar uma anotação ao encontro e vê-la na preparação do 1:1.

**Acceptance Scenarios**:

1. **Given** uma anotação, **When** a líder escolhe "Levar para o próximo encontro", **Then** ela aparece na preparação do 1:1 daquela pessoa.
2. **Given** uma anotação já resolvida, **When** a líder abre a preparação do 1:1, **Then** ela não aparece como lembrete.

---

### Edge Cases

- Pessoa sem nenhuma anotação: a aba mostra um convite ("Registre o primeiro ponto…"), não uma tela vazia ou pedido de desculpas.
- Descrição muito longa: o Bonsai avisa quanto passou do limite e não salva.
- Pessoa desligada ou excluída: suas anotações deixam de aparecer junto com ela (mesma regra de exclusão lógica do restante do app).
- Outra pessoa que acesse o Bonsai (outra líder, ou a própria pessoa anotada): nunca vê estas anotações.
- Combinado da anotação concluído ou cancelado na aba Combinados: a anotação reflete (feito aparece marcado, cancelado deixa de aparecer).
- Prazo no passado ao criar: permitido (a líder pode registrar algo já atrasado), sem bloquear.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A página de cada pessoa MUST ter uma aba "Anotações" ao lado de Encontros e Combinados.
- **FR-002**: A líder MUST poder criar, editar e excluir anotações de uma pessoa, com descrição (obrigatória), tipo (Combinado não cumprido, Ponto de atenção, Elogio) e data (hoje por padrão).
- **FR-003**: Cada anotação MUST ter uma situação: "Aberta" ou "Resolvida", por ação da líder, que também pode reabrir.
- **FR-004**: A líder MUST poder criar, dentro da anotação, combinados da pessoa (texto obrigatório, prazo opcional, responsável: a líder ou a pessoa), ligados à anotação e visíveis também na aba Combinados.
- **FR-005**: A líder MUST poder marcar como feito (ou desmarcar) e cancelar um combinado direto na anotação; a mudança vale também em Combinados.
- **FR-006**: A lista MUST mostrar as anotações da mais recente para a mais antiga, com filtros por situação e contagem de cada uma.
- **FR-007**: A anotação MUST destacar, com tom de atenção, combinados abertos com prazo vencido.
- **FR-008**: (Removido: não há mais passo a promover; o combinado nasce direto.)
- **FR-009**: A líder MUST poder levar uma anotação aberta para o próximo encontro, e ela MUST aparecer na preparação do 1:1 da pessoa enquanto não estiver resolvida.
- **FR-010**: As anotações e planos MUST ser visíveis somente à líder dona da pessoa: nunca à própria pessoa nem a outras líderes.
- **FR-011**: Excluir uma anotação MUST pedir confirmação e MUST seguir a regra de exclusão lógica do projeto (nada é apagado de fato).
- **FR-012**: Todo texto da tela MUST seguir a identidade e o tom do Bonsai (`frontend/BRAND.md`): sereno e direto, sem "cobrança", "desempenho", "nota" ou "monitorar".

### Key Entities

- **Anotação**: algo que aconteceu com uma pessoa. Tem descrição, tipo, data, situação (aberta ou resolvida) e pertence a uma pessoa e à líder que a registrou.
- **Combinado** (já existe): compromisso com a pessoa. Pode nascer de uma anotação e então fica ligado a ela.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A líder registra uma anotação em menos de 1 minuto, a partir da página da pessoa.
- **SC-002**: A líder cria 3 combinados a partir de uma anotação em menos de 3 minutos.
- **SC-003**: Em teste com 5 anotações em situações variadas, a líder encontra as abertas em até 2 cliques.
- **SC-004**: 100% das anotações e planos ficam invisíveis para quem não é a líder dona (verificado com um segundo usuário).
- **SC-005**: Um combinado criado na anotação aparece na lista de Combinados da pessoa imediatamente.

## Assumptions

- **Quem usa**: a líder (gestora) que já usa o Bonsai para seus encontros. Pessoas anotadas não acessam esta aba.
- **Privacidade**: visível só à líder dona da pessoa (sugestão aceita implicitamente na conversa; a pessoa anotada nunca vê).
- **Tipos**: lista curta fixa (Combinado não cumprido, Ponto de atenção, Elogio). Tipos livres ficam de fora desta versão.
- **Anotação e Combinado separados, ligados**: a anotação é o registro privado da líder; o Combinado é o compromisso. A anotação só aponta para os combinados que nasceram dela (revisão de 2026-10-27: o antigo "plano de ação com passos" foi retirado por duplicar o Combinado e deixar a tela confusa; combinados com responsável "você" cobrem o que só a líder faz).
- **Fora desta versão**: anexos, comentários de outras pessoas, notificações e lembretes automáticos, relatório consolidado do time, análise por IA das anotações.
- **Decision**: segue a stack e as convenções atuais do projeto (React, API Node com Prisma, Postgres) e o padrão de exclusão lógica. **Why**: é o que o projeto já usa; nenhuma tecnologia nova é necessária.
- **Decision**: "Anotações" como nome na interface, no lugar de "feedback". **Why**: o tom do Bonsai evita linguagem de avaliação e cobrança.
