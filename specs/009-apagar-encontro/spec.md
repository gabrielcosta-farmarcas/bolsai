# Feature Specification: Apagar um encontro

**Feature Branch**: `009-apagar-encontro`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Quero ter a opção de apagar um encontro e, consequentemente, o resumo, combinados, evolução, perguntas, meu feedback e notas privadas. Isso deve acontecer quando eu apagar um encontro."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apagar um encontro e tudo que saiu dele (Priority: P1)

Na tela do encontro, a líder escolhe "Apagar encontro". O Bonsai pede uma confirmação clara (dizendo que não dá para desfazer). Ao confirmar, o encontro some junto com tudo que foi gerado a partir dele: transcrição, resumo, combinados, evolução, perguntas, o feedback para a líder e as notas privadas. A líder volta para a página da pessoa.

**Why this priority**: É o pedido inteiro. Sem isso, um encontro criado por engano ou sensível demais fica para sempre.

**Independent Test**: Criar um encontro, analisar, revisar; apagar; conferir que ele não aparece mais na lista da pessoa, nem na linha do tempo, nem nos combinados, e que abrir o endereço antigo mostra "Encontro não encontrado".

**Acceptance Scenarios**:

1. **Given** um encontro com análise revisada, **When** a líder confirma "Apagar encontro", **Then** o encontro desaparece da lista da pessoa e a líder é levada à página da pessoa.
2. **Given** o mesmo encontro, **When** ele é apagado, **Then** os combinados criados nele deixam de aparecer na lista de combinados da pessoa e no painel.
3. **Given** o mesmo encontro, **When** ele é apagado, **Then** resumo, evolução, perguntas, feedback e notas privadas não podem mais ser vistos nem exportados.
4. **Given** o pedido de apagar, **When** a líder cancela na confirmação, **Then** nada é apagado.

---

### User Story 2 - Apagar um encontro que ainda não foi analisado (Priority: P2)

Também vale para encontro só com transcrição (sem análise): apaga o encontro e a transcrição.

**Why this priority**: Mesmo caminho, só com menos dados.

**Independent Test**: Criar encontro, não analisar, apagar.

**Acceptance Scenarios**:

1. **Given** um encontro sem análise, **When** a líder apaga, **Then** ele some da lista.

---

### Edge Cases

- Encontro com análise ainda em andamento: apagar é permitido; o resultado da análise, ao chegar, é descartado e não recria nada.
- Combinado nascido em outro encontro e concluído neste: continua existindo (só os criados *neste* encontro são apagados).
- Encontro de outra líder ou já apagado: aparece "Encontro não encontrado".
- Falha ao apagar: nada é apagado pela metade; a líder vê uma mensagem de erro e pode tentar de novo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela do encontro MUST ter a ação "Apagar encontro", com confirmação que avisa que não dá para desfazer.
- **FR-002**: Ao confirmar, o sistema MUST apagar de forma definitiva o encontro, a transcrição, todas as análises (resumo, evolução, perguntas, feedback à líder, notas privadas) e os combinados criados nesse encontro.
- **FR-003**: A exclusão MUST ser tudo ou nada.
- **FR-004**: Depois de apagado, o encontro MUST sumir da lista da pessoa, da linha do tempo, dos combinados, do painel e das exportações.
- **FR-005**: O sistema MUST permitir apagar só encontros da própria líder.
- **FR-006**: Após apagar, a líder MUST voltar à página da pessoa, com aviso de que o encontro foi apagado.

### Key Entities

- **Encontro**: um 1:1 com transcrição.
- **Análise**: resultado da IA (e da revisão da líder) de um encontro: resumo, evolução, perguntas, feedback, notas privadas.
- **Combinado**: compromisso nascido num encontro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em até 2 cliques (apagar + confirmar) a líder remove um encontro.
- **SC-002**: Após apagar, 0 dados do encontro (transcrição, análises, combinados dele) permanecem acessíveis.
- **SC-003**: Nenhuma exclusão deixa dados pela metade.

## Assumptions

- Decision: apagar de verdade (não só esconder). Why: a transcrição e as notas privadas são sensíveis e a líder pediu que sumam; o projeto só usa "esconder" para pessoas (liderados).
- Decision: sem lixeira nem desfazer. Why: não foi pedido; a confirmação protege contra clique errado.
- Combinados do próprio encontro são apagados mesmo se já concluídos, como pedido.
- Os combinados de outros encontros não mudam.
