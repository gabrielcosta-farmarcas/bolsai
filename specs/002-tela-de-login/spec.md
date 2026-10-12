# Feature Specification: Tela de login (somente front)

**Feature Branch**: `001-bonsai-mvp1` (continua na branch atual)
**Created**: 2026-10-11
**Status**: Draft
**Input**: "Implementar a tela de login, apenas o front", seguindo o mockup enviado (tema claro e escuro). O login é simulado; o login de verdade (Keycloak, Google) fica para a Fase 3.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar com o e-mail de trabalho (Priority: P1)

A líder abre o Bonsai, vê a tela de entrada, informa o e-mail de trabalho, clica em Continuar e chega à tela inicial.

**Why this priority**: é a porta de entrada do app; sem ela não há o que proteger nem o que testar.

**Independent Test**: abrir o app sem ter entrado, preencher o e-mail, clicar em Continuar e ver a tela inicial.

**Acceptance Scenarios**:

1. **Given** quem não entrou, **When** abre qualquer endereço do app, **Then** vê a tela de login.
2. **Given** a tela de login, **When** informa um e-mail válido e clica em Continuar, **Then** vai para a tela inicial (ou para a tela que tentou abrir antes).
3. **Given** quem já entrou, **When** fecha e reabre o app, **Then** continua entrado, sem ver o login.
4. **Given** quem já entrou, **When** abre o endereço do login, **Then** é levada para a tela inicial.

---

### User Story 2 - Entrar com Google (Priority: P2)

Abaixo de "ou", o botão "Entrar com Google" leva a pessoa para dentro do app, como se tivesse entrado pela conta Google.

**Independent Test**: clicar em Entrar com Google e ver a tela inicial.

**Acceptance Scenarios**:

1. **Given** a tela de login, **When** clica em Entrar com Google, **Then** entra e vai para a tela inicial (simulado, sem abrir o Google).

---

### User Story 3 - Erro claro no e-mail (Priority: P2)

Se o e-mail estiver vazio ou mal escrito, a tela diz o que corrigir, em português simples.

**Independent Test**: clicar em Continuar com o campo vazio e com e-mail inválido.

**Acceptance Scenarios**:

1. **Given** o e-mail vazio, **When** clica em Continuar, **Then** vê "Informe seu e-mail de trabalho." e não entra.
2. **Given** um e-mail sem formato válido, **When** clica em Continuar, **Then** vê "Informe um e-mail válido." e não entra.

---

### User Story 4 - Sair (Priority: P2)

Dentro do app, há um botão Sair; ao clicar, a pessoa volta ao login e precisa entrar de novo.

**Independent Test**: entrar, clicar em Sair, tentar abrir uma tela interna.

**Acceptance Scenarios**:

1. **Given** quem entrou, **When** clica em Sair, **Then** vai para o login.
2. **Given** quem saiu, **When** tenta abrir uma tela interna, **Then** cai no login.

### Edge Cases

- Endereço interno aberto direto (ex.: um encontro) sem ter entrado: vai ao login e, depois de entrar, volta para esse endereço.
- Espaços antes ou depois do e-mail são ignorados.
- Enter no teclado envia o formulário; leitor de tela anuncia o erro.
- Tema escuro e celular: a tela segue o mockup nos dois temas e em telas estreitas.
- Os links "Termos de uso" e "Política de privacidade" ainda não têm página.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela MUST seguir o mockup e a identidade visual (`frontend/BRAND.md`): card centralizado com logo vertical (símbolo de 52 px) e a frase "cuidado contínuo, crescimento visível", sem sombras, nos temas claro e escuro.
- **FR-002**: O card MUST ter, nesta ordem: campo "E-mail de trabalho" (exemplo "voce@empresa.com.br"), botão Continuar, divisor "ou", botão "Entrar com Google" e o aviso "Ao entrar, você concorda com os Termos de uso e a Política de privacidade."
- **FR-003**: O sistema MUST validar que o e-mail está preenchido e em formato válido, com mensagens em português, junto ao campo.
- **FR-004**: Com e-mail válido, Continuar MUST entrar (login simulado) e registrar no navegador que a pessoa entrou.
- **FR-005**: "Entrar com Google" MUST entrar de forma simulada, sem sair do app nem chamar o Google.
- **FR-006**: O sistema MUST lembrar que a pessoa entrou até ela clicar em Sair.
- **FR-007**: Todas as telas do app, exceto o login, MUST redirecionar para o login quando a pessoa não entrou, e voltar à tela pedida depois de entrar.
- **FR-008**: O app MUST ter um botão Sair visível na barra superior para quem entrou.
- **FR-009**: Nenhuma chamada ao servidor é feita pelo login; a camada de entrada deve ficar isolada para a Fase 3 trocá-la pelo login real sem refazer as telas.
- **FR-010**: Os links de Termos e Privacidade MUST aparecer como no mockup; por não haver páginas ainda, não levam a lugar nenhum.

### Key Entities

- **Sessão de login (no navegador)**: indica apenas se a pessoa entrou e o e-mail informado (ou "Google"), para exibição. Não é segurança real.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quem abre o app pela primeira vez chega ao login e, com e-mail válido, à tela inicial em menos de 15 segundos.
- **SC-002**: 100% das telas internas redirecionam ao login quando não há entrada.
- **SC-003**: Os erros do campo aparecem na própria tela, sem recarregar.
- **SC-004**: A tela funciona em celular e computador, nos temas claro e escuro, e é usável só pelo teclado.

## Assumptions

- Login simulado: qualquer e-mail válido entra, e o Google também. Escolhido porque ainda não há servidor de login; **não protege dados de verdade** (o servidor continua aberto, como no MVP 1).
- Sem senha, porque o mockup não tem. Na Fase 3, o fluxo real (link por e-mail ou Google) entra no mesmo lugar.
- Fora do escopo: cadastro, páginas de Termos e Privacidade, bloqueio por tentativas, várias líderes, qualquer mudança no servidor.
- Rota do login: `/login`. Textos em português do Brasil.
