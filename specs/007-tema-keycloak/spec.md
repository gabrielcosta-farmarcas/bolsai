# Feature Specification: Tema Bonsai na tela de login do Keycloak

**Feature Branch**: `001-bonsai-mvp1` (continua na branch atual)
**Created**: 2026-10-12
**Status**: Draft
**Input**: "Personalizar a tela do Keycloak apenas para o projeto do Bonsai" e "pode criar o tema" (o Keycloak da empresa roda no Coolify; a pessoa tem acesso de administrador e instala o arquivo).

Cumpre a tarefa T035/T036 da spec 003 (marca e mensagens do Keycloak).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A tela de entrar parece o Bonsai (Priority: P1)

Quando a líder clica em entrar, a página do Keycloak (e-mail, senha, código do autenticador) aparece com a **marca Bonsai**: logo vertical, a frase "cuidado contínuo, crescimento visível", cores, fontes e cantos da identidade "Camadas", em claro e em escuro.

**Why this priority**: é a primeira coisa que a pessoa vê; hoje parece uma tela genérica de outro sistema.

**Independent Test**: abrir a tela de login do reino `bonsai` e comparar com a tela de login do Bonsai (`/login`): mesmo logo, cores e fontes. Abrir um login de outro reino e ver que continua igual a antes.

**Acceptance Scenarios**:

1. **Given** o tema instalado e ligado no reino `bonsai`, **When** a líder chega ao login, **Then** vê o logo vertical do Bonsai, o nome "Bonsai" no título da aba e a frase da marca.
2. **Given** o computador em modo escuro, **When** abre o login, **Then** a tela usa as cores do tema escuro do Bonsai (e o claro em modo claro).
3. **Given** a tela de código do autenticador, de troca de senha e de erro, **When** aparecem, **Then** têm o mesmo visual (não só a tela inicial).
4. **Given** outro reino do mesmo Keycloak, **When** alguém entra por ele, **Then** nada mudou.
5. **Given** um celular, **When** a líder abre o login, **Then** a tela se ajusta à largura, sem rolagem lateral.

---

### User Story 2 - Textos em português simples, sem dar pistas (Priority: P1)

Todos os textos da tela (botões, rótulos, avisos e erros) estão em **português do Brasil, em tom sereno e direto**. O erro de credenciais **não diz** qual dos dois (e-mail ou senha) está errado, e o aviso de conta bloqueada explica o que fazer.

**Why this priority**: faz parte da segurança definida na spec 003 e do tom de voz da marca.

**Independent Test**: errar a senha e ver "E-mail ou senha incorretos."; errar 5 vezes e ver o aviso de bloqueio temporário em português.

**Acceptance Scenarios**:

1. **Given** uma senha errada, **When** a líder tenta entrar, **Then** vê "E-mail ou senha incorretos." sem indicar qual.
2. **Given** uma conta bloqueada por tentativas, **When** tenta de novo, **Then** vê que a conta está bloqueada por alguns minutos e que deve tentar mais tarde.
3. **Given** a troca obrigatória de senha, **When** a tela aparece, **Then** os requisitos da senha (12 caracteres, maiúscula, minúscula, número e símbolo) estão claros em português.
4. **Given** qualquer tela do tema, **When** lida de ponta a ponta, **Then** não há palavras em inglês nem termos como "desempenho" ou "controle" (tom da marca).

---

### User Story 3 - Instalar sem risco, em poucos passos (Priority: P2)

O tema vem num **único arquivo** com um passo a passo curto para o administrador instalar no Coolify e ligar só no reino `bonsai`. Dá para **testar antes**, num Keycloak local descartável, sem tocar no servidor da empresa.

**Independent Test**: seguir o passo a passo no Keycloak local, ver o tema aparecer e voltar ao tema padrão desligando a opção.

**Acceptance Scenarios**:

1. **Given** o arquivo do tema, **When** o administrador o instala e liga no reino `bonsai`, **Then** a tela muda só nesse reino.
2. **Given** um problema com o tema, **When** o administrador volta a opção "Login theme" ao padrão, **Then** o login funciona como antes (o tema não impede ninguém de entrar).

### Edge Cases

- Fonte ou imagem que não carrega: a tela continua legível com a fonte do sistema.
- Tema instalado, mas não ligado no reino: nada muda (sem efeito colateral).
- Idiomas diferentes do português: caem no texto padrão do Keycloak, sem quebrar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O tema MUST aplicar a identidade "Camadas" (cores, fontes, raios, logo vertical e frase da marca) às telas de login: entrar, código do autenticador, troca de senha e erros.
- **FR-002**: O tema MUST funcionar em claro e escuro (segue o sistema) e em tela de celular.
- **FR-003**: Os textos MUST estar em português do Brasil, no tom da marca; o erro de credenciais MUST NOT revelar se o e-mail existe.
- **FR-004**: O tema MUST valer **somente** onde for ligado (reino `bonsai`); outros reinos MUST NOT mudar.
- **FR-005**: O tema MUST ser entregue como **um arquivo** pronto para instalar, com fontes e imagens dentro (sem carregar nada de sites de terceiros).
- **FR-006**: MUST haver um passo a passo de instalação, ligação e reversão no Coolify, e um modo de testar localmente sem tocar no servidor da empresa.
- **FR-007**: As cores e fontes MUST seguir `frontend/BRAND.md` (mesmos valores do `tokens.css`; nada inventado).
- **FR-008**: A tela MUST manter contraste de texto mínimo 4,5:1 e navegação por teclado.

### Key Entities

- **Tema de login Bonsai**: conjunto de estilos, imagens, fontes e textos que vestem a página de login do Keycloak.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Lado a lado, a tela de login do Keycloak e a tela `/login` do Bonsai usam o mesmo logo, as mesmas cores e as mesmas fontes (conferência visual com capturas em claro e escuro).
- **SC-002**: 100% dos textos das telas de login estão em português (conferência de todas as telas: entrar, autenticador, troca de senha, erro, bloqueio).
- **SC-003**: Desligar o tema devolve o login ao visual anterior em 1 passo, sem impedir ninguém de entrar.
- **SC-004**: A instalação por um administrador leva no máximo 5 minutos seguindo o passo a passo.
- **SC-005**: Todos os testes anteriores continuam verdes.

## Assumptions

- O Keycloak da empresa é da **família 26** (o painel de administração tem a interface "v2" desta família). O tema é feito para ela, sobre o tema padrão "keycloak.v2" (herda o layout e só troca visual e textos).
- **Só as telas de login** entram agora. E-mails do Keycloak, página da conta e painel de administração ficam de fora (o servidor de e-mail ainda nem existe).
- O **idioma** do reino passa a ser português do Brasil por padrão; a escolha de idioma na tela fica escondida.
- O logo e as fontes (Alegreya Sans 500, Source Sans 3 400 e 600) vão dentro do arquivo do tema, copiados dos arquivos oficiais da marca do projeto.
- O tema é ligado no reino pelo administrador (Realm settings → Themes → Login theme). O arquivo de referência `infrastructure/keycloak/bonsai-realm.json` passa a registrar `loginTheme: bonsai`.
- Fora do escopo: reproduzir pixel a pixel as telas do Bonsai (a tela do Keycloak tem estrutura própria), páginas de registro e login social (não usados).
