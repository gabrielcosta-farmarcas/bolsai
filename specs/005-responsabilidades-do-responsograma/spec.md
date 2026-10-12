# Feature Specification: Responsabilidades do responsograma na evolução

**Feature Branch**: `001-bonsai-mvp1` (continua na branch atual)
**Created**: 2026-10-11
**Status**: Draft
**Input**: "Cada frase do responsograma é uma responsabilidade; o sistema deve usar essa lógica" e "colocar 10 campos para cadastrar as responsabilidades, um campo de texto por responsabilidade". Decisões do usuário: **10 campos de texto, um por responsabilidade**; cada responsabilidade aparece com **título curto, e a frase completa ao abrir**; **todas** as responsabilidades do responsograma aparecem sempre, as ainda não tratadas como **"ainda não conversado"**.

Altera funcionalidades da spec 001 (responsograma, análise do 1:1 e evolução por responsabilidade).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Um campo para cada responsabilidade (Priority: P1)

Ao cadastrar o responsograma, a líder vê **10 campos de texto, um por responsabilidade**, e preenche **no mínimo 3** (até 10). O Bonsai trata cada campo preenchido como **uma responsabilidade própria**, com um **título curto** sugerido automaticamente, que a líder pode corrigir.

**Why this priority**: sem itens reconhecidos, nada mais funciona.

**Independent Test**: preencher 4 dos 10 campos com frases longas e ver 4 responsabilidades, cada uma com um título curto editável.

**Acceptance Scenarios**:

1. **Given** os 10 campos, **When** a líder preenche 4 e salva, **Then** o Bonsai reconhece 4 responsabilidades (campos vazios são ignorados) e sugere um título curto para cada.
2. **Given** menos de 3 campos preenchidos, **When** a líder tenta salvar, **Then** o Bonsai não salva e diz "Preencha pelo menos 3 responsabilidades", indicando quantas faltam.
3. **Given** os títulos sugeridos, **When** a líder edita um título, **Then** o novo título vale em todo lugar.
4. **Given** um arquivo de responsograma enviado (PDF ou Word), **When** o texto é lido, **Then** os parágrafos preenchem os campos, na ordem, para a líder conferir e ajustar antes de salvar (até 10; se passar, avisa quais ficaram de fora).
5. **Given** a sugestão de título indisponível (IA fora do ar), **When** a líder salva, **Then** o responsograma é salvo mesmo assim, usando o começo da frase como título provisório.

---

### User Story 2 - A análise do 1:1 aponta para a responsabilidade certa (Priority: P1)

Ao analisar um encontro, a IA relaciona cada observação (evolução, ponto de atenção ou neutro) a **uma responsabilidade da lista**, e não a um nome livre. Na revisão, a líder pode mudar a qual responsabilidade a observação se refere.

**Independent Test**: analisar um 1:1 de uma pessoa com 4 responsabilidades e ver cada observação ligada a uma delas, sem nomes inventados.

**Acceptance Scenarios**:

1. **Given** uma pessoa com responsabilidades cadastradas, **When** a análise termina, **Then** cada observação aponta para uma responsabilidade existente.
2. **Given** uma observação que não combina com nenhuma, **When** a IA a registra, **Then** ela fica marcada como "Fora das responsabilidades", sem ser forçada em uma.
3. **Given** a revisão, **When** a líder troca a responsabilidade de uma observação, **Then** a mudança vale para a evolução.

---

### User Story 3 - A evolução mostra todas as responsabilidades (Priority: P1)

Na tela da pessoa, **Evolução por responsabilidade** mostra **uma fileira para cada responsabilidade do responsograma atual**, com o título curto e uma camada (marcador) por encontro em que ela foi citada (evolução, atenção ou neutro). Ao clicar, aparece a frase completa e as observações de cada encontro. A responsabilidade **sem nenhum marcador** é uma responsabilidade que **nunca foi citada** nos 1:1: ela vira um **alerta para a líder** ("ainda não conversado"), na própria fileira e num aviso no topo da tela.

**Independent Test**: com 4 responsabilidades e 2 encontros analisados que tocaram em 2 delas, ver 4 fileiras, duas com camadas e duas "ainda não conversado".

**Acceptance Scenarios**:

1. **Given** um responsograma com 4 itens, **When** a líder abre a evolução, **Then** vê as 4 fileiras, na ordem do documento.
2. **Given** um item nunca citado em nenhum 1:1 revisado, **When** a líder vê a fileira, **Then** a fileira fica em destaque de alerta, sem marcadores, com o texto "Ainda não conversado".
3. **Given** uma ou mais responsabilidades sem nenhum marcador, **When** a líder abre a evolução, **Then** vê no topo um aviso do tipo "2 responsabilidades ainda não foram conversadas nos 1:1", listando os títulos.
4. **Given** que ainda não há nenhum 1:1 analisado e revisado, **When** a líder abre a evolução, **Then** as responsabilidades aparecem sem alerta (só "Nenhum encontro analisado ainda"), para não gerar alarme falso.
5. **Given** uma responsabilidade citada em algum 1:1, **When** a líder vê a fileira, **Then** ela não tem alerta, mesmo que o último encontro não a tenha citado.
6. **Given** uma fileira, **When** a líder clica nela, **Then** vê a frase completa e, por encontro, a data e a observação.
7. **Given** observações "fora das responsabilidades", **When** a líder abre a evolução, **Then** elas aparecem numa seção à parte, recolhida.

---

### User Story 4 - O responsograma muda e o histórico se mantém (Priority: P2)

Quando a líder sobe uma **nova versão** do responsograma, as responsabilidades que **não mudaram** mantêm todo o histórico. Uma frase **editada** é uma responsabilidade nova; a antiga fica em "Responsabilidades anteriores", com o histórico preservado.

**Acceptance Scenarios**:

1. **Given** uma nova versão com 3 campos iguais e 1 alterado, **When** a líder salva, **Then** as 3 mantêm as camadas antigas, e a alterada começa sem histórico.
2. **Given** um campo esvaziado, **When** a líder abre a evolução, **Then** ela aparece em "Responsabilidades anteriores", recolhida.
3. **Given** uma pequena diferença de espaços ou de maiúsculas, **When** a líder salva, **Then** o campo continua sendo a mesma responsabilidade.

---

### Edge Cases

- Não existe pessoa **sem** responsograma: o cadastro exige no mínimo 3 responsabilidades. A análise, portanto, sempre tem de 3 a 10 responsabilidades para receber.
- Se a líder esvaziar campos e restar **menos de 3**, o Bonsai não salva a nova versão e mantém a atual.
- O tamanho total enviado à IA (até 10 responsabilidades de 1.000 caracteres) cabe sempre no limite da análise; se, somado à transcrição, passar do limite, o Bonsai avisa a líder em vez de cortar as responsabilidades.
- Arquivo com **mais de 10 parágrafos**: os 10 primeiros preenchem os campos e o Bonsai avisa quais ficaram de fora; a líder escolhe o que manter.
- Campos com menos de 3 caracteres são ignorados, com aviso; cada campo aceita até 1.000 caracteres.
- Dois campos com o mesmo texto viram uma só responsabilidade, com aviso.
- A mesma observação nunca aparece em duas responsabilidades.
- A pessoa excluída continua sumindo de tudo (regra já existente).
- O texto das responsabilidades e das observações **não vai para o log**.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O cadastro do responsograma MUST oferecer **10 campos de texto**, um por responsabilidade, e o sistema MUST reconhecer cada campo não vazio como **uma responsabilidade**, na ordem dos campos, até o limite de **10 por pessoa**.
- **FR-001a**: O Bonsai MUST exigir **no mínimo 3** responsabilidades preenchidas para salvar um responsograma, tanto ao **cadastrar a pessoa** quanto ao **enviar uma nova versão**; não há pessoa sem responsograma.
- **FR-002**: Cada responsabilidade MUST ter um **título curto** (até 60 caracteres), sugerido automaticamente a partir da frase e **editável** pela líder, e a **frase completa** preservada como está.
- **FR-003**: Salvar o responsograma MUST funcionar mesmo sem a sugestão automática de título (usa o começo da frase).
- **FR-004**: A análise do 1:1 MUST receber **sempre todas** as responsabilidades preenchidas da versão atual do responsograma (nunca um subconjunto, resumo ou corte), em lista numerada, e MUST apontar, em cada observação de desenvolvimento, **qual responsabilidade** ela concerne, ou "fora das responsabilidades". Uma referência inválida MUST ser rejeitada e a análise refeita, como já ocorre com saídas inválidas.
- **FR-005**: A revisão MUST permitir à líder trocar a responsabilidade de uma observação.
- **FR-006**: A tela de evolução MUST mostrar **todas** as responsabilidades do responsograma atual, na ordem do documento, com título curto, um marcador por encontro em que foi citada e, ao abrir, a frase completa e as observações.
- **FR-006a**: A responsabilidade sem nenhum marcador, havendo pelo menos um 1:1 analisado e revisado, MUST ser sinalizada à líder como **alerta** ("Ainda não conversado"), na fileira e num aviso no topo da tela com a lista delas. O alerta some assim que a responsabilidade for citada em um 1:1 revisado.
- **FR-007**: Ao trocar de versão do responsograma, um campo MUST ser considerado a **mesma responsabilidade** se o texto for igual ignorando maiúsculas e espaços extras (mesmo que mudou de posição); campos alterados ou removidos MUST ficar em "Responsabilidades anteriores", com histórico preservado.
- **FR-008**: O que é novo MUST seguir o isolamento por líder (spec 003, etapa B): uma líder só vê e altera as responsabilidades das próprias pessoas.
- **FR-009**: O texto das responsabilidades e das observações MUST NOT ir para os logs.

### Key Entities

- **Responsabilidade**: um campo preenchido do responsograma de uma pessoa (frase completa, título curto, posição), identificada por um código estável entre versões enquanto o texto for o mesmo.
- **Sinal de desenvolvimento**: observação de um encontro (evolução, atenção ou neutro), ligada a uma responsabilidade ou a "fora das responsabilidades".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com um responsograma de 4 frases longas, 4 responsabilidades são reconhecidas e 100% das observações de uma análise apontam para uma delas ou para "fora das responsabilidades" (0 nomes livres novos).
- **SC-002a**: 100% das análises recebem todas as responsabilidades preenchidas da versão atual (teste que confere o conteúdo enviado à IA).
- **SC-002**: A evolução mostra o mesmo número de fileiras que o responsograma tem de responsabilidades, e 100% das que nunca foram citadas (com ao menos um 1:1 revisado) aparecem em alerta e no aviso do topo.
- **SC-003**: Trocar para uma nova versão do responsograma sem alterar um campo preserva 100% do histórico desse campo.
- **SC-004**: Todos os testes anteriores continuam verdes.

## Assumptions

- Os **10 campos** substituem o campo único "Responsabilidades (uma por linha)".
- **Não há dados antigos a migrar**: em 2026-10-11, a pedido do usuário, todo o conteúdo de teste (pessoas, encontros, análises, combinados e responsogramas) foi apagado do banco local, com backup fora do projeto. O usuário vai recadastrar tudo já no formato novo. Por isso esta spec **não** trata análises antigas com nomes livres.
- A missão/finalidade do cargo continua num campo à parte.
- Os títulos curtos são sugeridos pela mesma IA da análise; sem ela, vale o começo da frase.
- A análise usará uma **nova versão do prompt** (v4), preservando as anteriores; análises antigas não são refeitas.
- Fora do escopo: reanalisar encontros antigos, ligar responsabilidades a metas ou notas numéricas, comparar pessoas, o painel do liderado (spec 004; quando existir, poderá mostrar a evolução ao liderado numa decisão futura).
- **Dados reais continuam fora de uso**: o exemplo de responsabilidades enviado deve ser tratado como teste; a regra "só conversas fictícias" segue valendo até a fase de proteção de dados.
