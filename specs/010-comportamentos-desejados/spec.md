# Feature Specification: Comportamentos desejados no responsograma

**Feature Branch**: `main` (sem branch própria, como as specs anteriores)
**Created**: 2026-10-14
**Status**: Draft
**Input**: "Após as responsabilidades, temos que ter os comportamentos desejados e precisamos considerar isso no prompt. Pode ser um text area." Exemplo real: capacidade de gerenciamento de tempo e priorização, pensamento crítico, boa comunicação, organizado, empatia, ser imparcial, curiosidade, criatividade, relacionamento interpessoal, questionador, visão sistêmica, resolução de conflitos, influência positiva, tomada de decisão, resistência à frustração.

Estende o responsograma (specs 001 e 005) e a análise do 1:1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar os comportamentos desejados (Priority: P1)

No responsograma de uma pessoa, depois das responsabilidades, a líder vê um campo de texto livre **"Comportamentos desejados (opcional)"**. Ela escreve ali a lista de comportamentos esperados para o cargo (um por linha, ou como preferir) e salva junto com o restante do responsograma.

**Why this priority**: sem o dado guardado, a análise não tem o que considerar.

**Independent Test**: cadastrar uma pessoa preenchendo os comportamentos, salvar, reabrir o responsograma e ver o mesmo texto.

**Acceptance Scenarios**:

1. **Given** o cadastro de uma pessoa nova, **When** a líder preenche os comportamentos e salva, **Then** o texto fica guardado na versão 1 do responsograma e aparece ao reabrir.
2. **Given** uma pessoa já cadastrada, **When** a líder edita só os comportamentos e salva, **Then** nasce uma nova versão do responsograma com o texto novo, e as responsabilidades e o histórico de evolução continuam como estavam.
3. **Given** um responsograma sem comportamentos, **When** a líder salva, **Then** o Bonsai salva normalmente (o campo é opcional).
4. **Given** o campo passa do limite de tamanho, **When** a líder tenta salvar, **Then** o Bonsai avisa quanto passou e não salva.

---

### User Story 2 - A análise do 1:1 considera os comportamentos (Priority: P1)

Ao analisar um encontro, a IA recebe os comportamentos desejados da pessoa e os usa como **mais uma régua de leitura**, junto das responsabilidades e dos valores da Farmarcas: aponta, com fato ou trecho da conversa, quando um comportamento esperado apareceu (a favor) ou faltou (contra).

**Why this priority**: é o motivo da funcionalidade.

**Independent Test**: analisar um 1:1 de uma pessoa com comportamentos cadastrados e ver a análise citar um deles com base num trecho; analisar o de uma pessoa sem comportamentos e ver a análise igual à de hoje.

**Acceptance Scenarios**:

1. **Given** uma pessoa com comportamentos cadastrados e uma conversa que mostra um deles (por exemplo, tomou uma decisão difícil com clareza), **When** a análise termina, **Then** ela menciona o comportamento, com o fato ou trecho que o sustenta.
2. **Given** uma conversa que não mostra nenhum comportamento da lista, **When** a análise termina, **Then** ela não cita comportamento algum (sem forçar).
3. **Given** uma pessoa sem comportamentos cadastrados, **When** a análise roda, **Then** o resultado e o prompt funcionam como antes.
4. **Given** comportamentos cadastrados, **When** a IA os usa, **Then** não dá nota, não rotula a pessoa e não infere personalidade: descreve só o que foi observado na conversa.

---

### User Story 3 - Ver os comportamentos no responsograma (Priority: P2)

Na tela da pessoa, onde a líder vê o responsograma vigente e as versões antigas, os comportamentos desejados aparecem logo após as responsabilidades, em cada versão, para ela conferir o que a análise está considerando.

**Independent Test**: abrir o responsograma de uma pessoa com comportamentos e ver o texto; abrir uma versão antiga e ver o que valia naquela época.

**Acceptance Scenarios**:

1. **Given** uma pessoa com comportamentos, **When** a líder abre o responsograma, **Then** vê o texto após as responsabilidades.
2. **Given** uma versão antiga sem comportamentos, **When** a líder a abre, **Then** a seção não aparece (ou diz "não informado").

---

### Edge Cases

- Pessoas cadastradas antes desta mudança ficam sem comportamentos; nada quebra e nada é exigido delas.
- Texto só com espaços ou quebras de linha conta como vazio.
- O texto dos comportamentos soma ao tamanho enviado à IA; se, junto com a transcrição, passar do limite da análise, o Bonsai avisa a líder em vez de cortar sem aviso (mesmo tratamento das responsabilidades).
- A transcrição ou o texto dos comportamentos podem trazer ordens dirigidas à IA: tudo isso é tratado como dado, nunca como instrução.
- Os comportamentos são texto único, sem divisão em itens: o Bonsai não os separa nem os mostra um a um.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O cadastro e a edição do responsograma MUST oferecer um campo de texto livre "Comportamentos desejados (opcional)", posicionado depois das responsabilidades.
- **FR-002**: O campo MUST ser opcional; vazio é válido.
- **FR-003**: O texto MUST ser guardado como parte da versão do responsograma, de modo que cada versão preserve os comportamentos que valiam nela.
- **FR-004**: Editar só os comportamentos MUST gerar uma nova versão do responsograma, sem alterar as responsabilidades nem o histórico de evolução delas.
- **FR-005**: O campo MUST aceitar até 3.000 caracteres; acima disso, o Bonsai avisa quanto passou e não salva.
- **FR-006**: A análise do 1:1 MUST receber os comportamentos da versão vigente do responsograma e considerá-los como régua de leitura, citando um comportamento só com fato ou trecho da conversa.
- **FR-007**: A análise MUST funcionar como antes para quem não tem comportamentos cadastrados.
- **FR-008**: O prompt padrão da análise MUST ser atualizado para explicar o uso dos comportamentos (régua de leitura, sem nota, sem rótulo, sem inferir personalidade), de forma curta.
- **FR-009**: A tela do responsograma MUST mostrar os comportamentos de cada versão, depois das responsabilidades.
- **FR-010**: O texto dos comportamentos MUST ser tratado como dado sensível e como dado, não instrução: não vai para log nem para a exportação do resumo.

### Key Entities

- **Versão do responsograma**: já existente (missão, responsabilidades, arquivo). Ganha o campo **comportamentos desejados** (texto livre, opcional).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A líder cadastra os comportamentos de uma pessoa em menos de 1 minuto, colando uma lista pronta.
- **SC-002**: Em uma análise de pessoa com comportamentos, 100% dos comportamentos citados trazem um fato ou trecho da conversa que os sustenta.
- **SC-003**: Pessoas sem comportamentos continuam sendo analisadas sem nenhuma mudança visível (0 erros novos).
- **SC-004**: Mudar só os comportamentos não apaga nem altera nenhuma camada da evolução das responsabilidades.

## Assumptions

- Decision: os comportamentos ficam **na versão do responsograma**, como a missão. Why: assim o histórico mostra o que valia em cada época e o que a análise usou, sem nova tela de cadastro.
- Decision: **um campo único de texto**, sem separar em itens. Why: foi o pedido ("pode ser um text area") e o exemplo real é uma lista simples; separar em itens e medir a evolução de cada um fica para uma próxima etapa, se a líder quiser.
- Decision: a evolução por responsabilidade **não muda**; os comportamentos só alimentam a análise e a tela do responsograma. Why: sem essa decisão a funcionalidade dobraria de tamanho; dá para estender depois.
- Decision: o limite é 3.000 caracteres. Why: o exemplo real tem cerca de 400; o limite deixa folga sem pesar no custo da análise.
- A tela de cadastro e a de edição do responsograma já existem (spec 005) e serão reaproveitadas.
- O campo vale para uma pessoa por vez, como o responsograma; não há modelo de comportamentos compartilhado entre cargos.
- A atualização do prompt vale para o arquivo padrão; quem colou um prompt próprio em Configurações precisa colar a nova versão.
