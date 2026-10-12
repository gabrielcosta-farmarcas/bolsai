# Feature Specification: Painel do liderado

**Feature Branch**: `001-bonsai-mvp1` (continua na branch atual)
**Created**: 2026-10-11
**Status**: Draft
**Input**: "Criar o painel da Ellen, para ela acessar e ver os combinados, o resumo do 1:1 e os temas falados." Decisões do usuário: o conteúdo só aparece **depois que a líder compartilha** cada 1:1, e o painel é **somente leitura**.

Muda o que a spec 001 dizia ("acesso de liderado fora do escopo"). Depende da spec 003 (login pelo Keycloak e papéis).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O liderado vê o que foi compartilhado com ele (Priority: P1)

O liderado entra no Bonsai com a conta dele (e-mail, senha e autenticador, como a líder) e cai no **painel**: a lista dos 1:1 que a líder compartilhou e, em cada um, o resumo, os temas conversados e os combinados.

**Why this priority**: é a entrega pedida; sem ela o resto não tem uso.

**Independent Test**: com um liderado com conta e um 1:1 compartilhado, entrar e ver resumo, temas e combinados; um 1:1 não compartilhado não aparece.

**Acceptance Scenarios**:

1. **Given** um liderado com conta, **When** entra, **Then** vê o painel dele, sem a navegação da líder (Pessoas, Combinados, novo encontro).
2. **Given** 1:1 compartilhados, **When** abre o painel, **Then** vê a lista, do mais recente ao mais antigo, com a data de cada encontro.
3. **Given** um 1:1 da lista, **When** abre, **Then** vê o **resumo**, os **temas** e os **combinados** daquele encontro (descrição, quem é o responsável, prazo e situação).
4. **Given** 1:1 ainda não compartilhados, **When** o liderado abre o painel, **Then** não vê nem sabe que existem.
5. **Given** nenhum 1:1 compartilhado, **When** abre o painel, **Then** vê uma mensagem simples ("Ainda não há encontros compartilhados com você.").
6. **Given** o painel, **When** olha a visão de **combinados**, **Then** vê todos os combinados dos encontros compartilhados em um só lugar, os em aberto primeiro, com os atrasados destacados.

---

### User Story 2 - A líder compartilha (e deixa de compartilhar) cada 1:1 (Priority: P1)

Na tela do encontro, depois de salvar a versão final, a líder clica em **Compartilhar com [nome]**. Pode **deixar de compartilhar** a qualquer momento.

**Independent Test**: salvar a versão final, compartilhar, conferir no painel do liderado; descompartilhar e conferir que sumiu.

**Acceptance Scenarios**:

1. **Given** um encontro **sem** versão final salva, **When** a líder abre a tela, **Then** o botão de compartilhar não está disponível e explica o motivo.
2. **Given** um encontro com versão final, **When** a líder compartilha, **Then** o liderado passa a ver aquela versão (e só ela).
3. **Given** um encontro compartilhado, **When** a líder deixa de compartilhar, **Then** ele some do painel na hora.
4. **Given** um encontro compartilhado, **When** a líder salva uma **nova versão final**, **Then** o compartilhamento é suspenso até ela compartilhar de novo (o liderado nunca vê uma versão que a líder não conferiu).
5. **Given** a tela de compartilhar, **When** a líder confirma, **Then** vê antes exatamente o que o liderado verá (resumo, temas, combinados) e que notas privadas e observações dela **não** vão.

---

### User Story 3 - A líder dá e retira o acesso do liderado (Priority: P2)

Na página da pessoa, a líder (ou o administrador) escolhe **Dar acesso**, informa o e-mail e recebe uma **senha temporária de uso único** para repassar (sem servidor de e-mail). No primeiro acesso, o liderado define a própria senha e configura o autenticador. A líder pode **retirar o acesso**.

**Independent Test**: dar acesso, entrar com a conta nova em outra janela, retirar o acesso e ver que a sessão cai.

**Acceptance Scenarios**:

1. **Given** uma pessoa sem conta, **When** a líder dá acesso, **Then** a conta nasce com o papel `liderado`, ligada **só àquela pessoa**, e a senha temporária aparece uma vez.
2. **Given** uma pessoa que já tem conta, **When** a líder tenta dar acesso de novo, **Then** vê que já existe (e pode gerar nova senha temporária).
3. **Given** um liderado com conta, **When** a líder retira o acesso, **Then** ele perde o acesso na hora, e os dados ficam guardados.
4. **Given** uma pessoa excluída (inativada) pela líder, **When** ela tenta entrar, **Then** não vê nada.

### Edge Cases

- O liderado nunca alcança dados de outra pessoa, nem de outra líder, nem por endereço direto (resposta "não encontrado").
- Um liderado não acessa nenhuma tela ou rota da líder (resposta "sem permissão").
- A líder pode ter a pessoa cadastrada **sem** conta; o painel só existe para quem tem conta.
- O e-mail do liderado não pode ser o de uma conta de líder ou administrador já existente.
- Se o autenticador do liderado for perdido, a recuperação é igual à da líder (nova senha temporária; spec 003, etapa D).
- Compartilhar sem a versão final salva não é permitido.
- Mensagens e telas em português simples, com a identidade visual do Bonsai.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST ter o papel **`liderado`**, separado de `lider` e `administrador`. Cada conta de liderado MUST estar ligada a **exatamente uma pessoa** cadastrada.
- **FR-002**: O liderado MUST entrar pelo mesmo login (e-mail, senha e autenticador) e ver um **painel próprio**, só de leitura.
- **FR-003**: O painel MUST mostrar, para cada 1:1 **compartilhado**: data, **resumo**, **temas** e **combinados** (descrição, responsável, prazo, situação). Nada além disso.
- **FR-004**: O painel MUST NOT mostrar notas privadas da líder, feedback para a líder, pontos de atenção, sinais de desenvolvimento, perguntas para o próximo encontro, trechos da transcrição, o mapa de responsabilidades nem qualquer dado de outras pessoas.
- **FR-005**: O conteúdo MUST aparecer **somente depois que a líder compartilha** o 1:1, e só a partir da **versão final salva**. Compartilhar MUST ser possível desfazer a qualquer momento, com efeito imediato.
- **FR-006**: Salvar uma nova versão final de um 1:1 compartilhado MUST suspender o compartilhamento até a líder compartilhar de novo.
- **FR-007**: A API do liderado MUST ficar em rotas **separadas** das da líder (`/api/v1/me/**`), devolvendo **somente** os campos permitidos (lista de campos explícita, nunca o registro inteiro). Rotas da líder MUST responder 403 ao liderado; rotas do liderado MUST responder 403 à líder sem o papel.
- **FR-008**: O liderado MUST acessar apenas o que está ligado à sua própria pessoa. Qualquer outro registro MUST responder "não encontrado".
- **FR-009**: A líder (ou o administrador) MUST poder **dar acesso**, gerando senha temporária de uso único (validade de 72 horas), e **retirar acesso**, derrubando as sessões na hora. O primeiro acesso MUST exigir troca de senha e cadastro do autenticador.
- **FR-010**: Retirar acesso, inativar a pessoa ou descompartilhar MUST ter efeito imediato no que o liderado enxerga (a API confere a cada pedido, não só no login).
- **FR-011**: A tela de compartilhar MUST mostrar antes à líder exatamente o que o liderado verá.
- **FR-012**: O painel MUST seguir `frontend/BRAND.md`, funcionar em celular e computador, nos temas claro e escuro, e ser usável só pelo teclado.
- **FR-013**: Registros de log MUST NOT conter conteúdo de conversa nem senhas; o compartilhamento e a retirada de acesso MUST ficar registrados (quem, quando, qual encontro) para a auditoria futura.

### Key Entities

- **Acesso do liderado**: liga uma conta do Keycloak (papel `liderado`) a **uma** pessoa cadastrada; ativo ou retirado.
- **Compartilhamento**: liga um encontro a uma versão final específica da análise, com data e quem compartilhou; ativo ou suspenso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com duas pessoas e dois líderes, 0 registros alheios aparecem para um liderado, pela tela ou pela API.
- **SC-002**: 100% dos campos proibidos (FR-004) ficam fora de toda resposta das rotas do liderado (teste que varre a resposta).
- **SC-003**: Descompartilhar ou retirar acesso tira o conteúdo da tela do liderado no próximo pedido (menos de 5 segundos).
- **SC-004**: A líder compartilha um 1:1 já revisado em até 3 cliques e menos de 30 segundos.
- **SC-005**: O liderado chega ao resumo de um encontro em até 2 cliques depois de entrar.
- **SC-006**: Todos os testes anteriores continuam verdes.

## Assumptions

- **Pré-requisitos**: spec 003 etapa B (isolamento entre líderes e papéis aplicados nas rotas) e, para "Dar acesso" pela tela, a etapa C (cliente de serviço do Keycloak para criar usuários). Sem a etapa C, a conta da Ellen pode ser criada à mão no Keycloak e ligada à pessoa por uma ação da líder.
- Painel **somente leitura**, e compartilhamento **manual** por encontro, como decidido pelo usuário.
- **Fora do escopo**: o liderado editar ou comentar, marcar combinados como feitos, ver a transcrição, ver o mapa de responsabilidades, notificações por e-mail, exportar, painel para várias líderes por pessoa.
- **LGPD e aviso ao liderado**: o painel exibe dados sobre a própria pessoa, o que é coerente com o direito de acesso, mas o texto de consentimento/aviso ao liderado e a política de retenção ficam para as etapas de LGPD; **continua valendo "só conversas fictícias"**.
- Os campos mostrados vêm da versão final revisada (`reviewedJson`); os combinados mostrados são os salvos a partir dos 1:1 compartilhados.
- Dados ainda não criptografados (fase de proteção de dados pendente).
