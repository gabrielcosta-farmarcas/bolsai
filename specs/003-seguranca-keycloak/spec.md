# Feature Specification: Segurança — login de verdade e permissões (Keycloak)

**Feature Branch**: `001-bonsai-mvp1` (continua na branch atual)
**Created**: 2026-10-11
**Status**: Draft
**Input**: "Autenticação, de preferência com e-mail e senha mais o autenticador; permissionamento também; configurar o Keycloak." Cadastro por convite sem envio de e-mail (senha temporária repassada pelo administrador). Papéis: líder e administrador. Substitui o login simulado da spec 002 (a tela `/login` do Bonsai continua).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar com e-mail, senha e autenticador (Priority: P1)

A pessoa abre o Bonsai, informa e-mail e senha na tela `/login` e confirma com o código de 6 dígitos do app autenticador. Só então entra.

**Why this priority**: sem isso o app continua aberto para qualquer um; é a base de todo o resto.

**Independent Test**: com um usuário já cadastrado, entrar com e-mail, senha e código e chegar à tela inicial; tentar com senha ou código errados e não conseguir.

**Acceptance Scenarios**:

1. **Given** quem não entrou, **When** abre qualquer tela, **Then** vai para `/login`.
2. **Given** e-mail e senha corretos, **When** informa também o código correto do autenticador, **Then** entra e vai à tela que pediu.
3. **Given** senha ou código errados, **When** tenta entrar, **Then** vê uma mensagem simples, sem dizer qual dos dois falhou.
4. **Given** várias tentativas erradas seguidas, **When** continua errando, **Then** a conta fica bloqueada por alguns minutos.
5. **Given** quem entrou, **When** clica em Sair, **Then** a sessão termina e qualquer tela volta a pedir login.
6. **Given** quem ficou muito tempo parado, **When** volta ao app, **Then** precisa entrar de novo.

---

### User Story 2 - O servidor só atende quem entrou (Priority: P1)

Todas as chamadas do app ao servidor exigem uma pessoa autenticada. Quem não entrou não consegue ler nem alterar nada, mesmo chamando o servidor direto.

**Independent Test**: chamar a API sem entrar e receber "não autenticado"; chamar entrando e receber os dados.

**Acceptance Scenarios**:

1. **Given** uma chamada sem credencial válida, **When** chega à API, **Then** recebe erro 401 e nenhum dado.
2. **Given** a credencial expirou, **When** o app chama a API, **Then** é levado a entrar de novo.
3. **Given** a verificação de saúde do servidor (`/health`), **When** chamada sem entrar, **Then** continua respondendo (usada pelo Docker).

---

### User Story 3 - Cada líder vê só o que é seu (Priority: P1)

Uma líder vê apenas as próprias pessoas, encontros, análises e combinados. Nem pela tela nem pela API ela alcança dados de outra líder.

**Independent Test**: com duas líderes, cada uma cria uma pessoa; nenhuma enxerga a da outra, inclusive abrindo o endereço direto.

**Acceptance Scenarios**:

1. **Given** duas líderes com dados, **When** uma lista pessoas, encontros ou combinados, **Then** só vê os seus.
2. **Given** o endereço de um registro de outra líder, **When** tenta abrir, **Then** vê "não encontrado" (sem confirmar que existe).
3. **Given** dados já criados na versão sem login, **When** o login real entra no ar, **Then** passam a pertencer à primeira líder cadastrada, sem perda.

---

### User Story 4 - Administrador convida e gerencia pessoas (Priority: P2)

O administrador cadastra nome e e-mail de uma nova pessoa, escolhe o papel (líder ou administrador) e recebe uma **senha temporária de uso único** e o endereço do Bonsai para repassar à pessoa por onde quiser (não há servidor de e-mail). Ele também pode desativar e reativar quem já tem conta. O administrador **não lê** o conteúdo dos 1:1 das líderes.

**Independent Test**: como administrador, convidar alguém, copiar a senha temporária, entrar em outra janela e concluir o primeiro acesso.

**Acceptance Scenarios**:

1. **Given** um administrador, **When** informa nome, e-mail e papel, **Then** vê, uma única vez, uma senha temporária para repassar.
2. **Given** a senha temporária, **When** a pessoa entra pela primeira vez, **Then** é obrigada a definir a própria senha e configurar o autenticador (QR code) antes de usar o app.
3. **Given** uma senha temporária vencida (após 72 horas) ou já trocada, **When** alguém tenta usá-la, **Then** não entra e deve pedir uma nova ao administrador.
4. **Given** um administrador, **When** desativa uma pessoa, **Then** ela perde o acesso na hora, e os dados dela são mantidos.
5. **Given** uma líder (sem ser administradora), **When** tenta abrir a tela de usuários, **Then** não tem acesso.
6. **Given** um administrador que não é líder, **When** abre qualquer endereço de pessoa ou encontro, **Then** não vê conteúdo de 1:1.

---

### User Story 5 - Recuperar acesso (Priority: P3)

Quem esqueceu a senha ou perdeu o celular do autenticador pede ajuda ao administrador, que gera uma nova senha temporária e remove o autenticador antigo.

**Independent Test**: administrador gera nova senha temporária; a pessoa refaz a senha e o autenticador.

**Acceptance Scenarios**:

1. **Given** uma pessoa que perdeu o autenticador, **When** o administrador gera uma nova senha temporária, **Then** ela entra, mas só depois de configurar um novo autenticador.

### Edge Cases

- O Keycloak fora do ar: a tela `/login` avisa "Não conseguimos entrar agora. Tente de novo em instantes." e o app não abre.
- Convite para um e-mail que já tem conta: o sistema avisa em vez de duplicar.
- O último administrador não pode ser desativado nem perder o papel.
- Duas abas: sair em uma encerra a sessão nas duas.
- Nenhum segredo (senhas, chaves) vai para o git; credenciais do Keycloak ficam só no `.env`.
- O Keycloak existente já pode ter outros sistemas e usuários: a configuração do Bonsai fica em um reino/cliente próprio ou claramente separado, sem alterar o que já existe.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda entrada MUST exigir e-mail, senha e código do autenticador (TOTP). Sem o segundo fator, não há acesso.
- **FR-002**: A tela `/login` do Bonsai MUST continuar sendo a porta de entrada visual e levar ao Keycloak (com a marca Bonsai), onde a pessoa digita e-mail, senha e código do autenticador. A senha nunca passa pelo código do Bonsai. *(Aprovado em 2026-10-11.)*
- **FR-003**: A API MUST recusar (401) qualquer chamada sem credencial válida, exceto `/health` e `/health/ready`.
- **FR-004**: Cada registro MUST pertencer a uma líder, e toda leitura e escrita MUST passar pelo ponto único de decisão de acesso já existente (`shared/security`), liberando só os dados da própria líder (404 para o resto).
- **FR-005**: O sistema MUST ter dois papéis: **líder** (dados próprios) e **administrador** (gerencia usuários, sem ver conteúdo de 1:1). Uma pessoa pode ter os dois.
- **FR-006**: O administrador MUST poder convidar com senha temporária de uso único e com validade, ver quem tem conta, desativar e reativar, e gerar nova senha temporária. O repasse da senha é manual (sem e-mail por enquanto).
- **FR-007**: O primeiro acesso com senha temporária MUST obrigar a definir senha forte e configurar o autenticador.
- **FR-008**: O sistema MUST bloquear a conta por alguns minutos após tentativas seguidas erradas e encerrar sessões paradas por muito tempo.
- **FR-009**: Sair MUST encerrar a sessão de verdade (no Keycloak), não só no navegador.
- **FR-010**: O Bonsai MUST usar o Keycloak que já existe como único motor de autenticação. A configuração necessária (cliente do app, papéis, regras de senha, autenticador obrigatório, bloqueio por tentativas) MUST ser feita por script/arquivo versionado e repetível, sem segredos no git; o endereço e as credenciais ficam só no `.env`.
- **FR-011**: Os dados já existentes MUST ser preservados e atribuídos à primeira líder; mudanças no banco só por migration.
- **FR-012**: Mensagens de erro MUST ser simples e não revelar se o e-mail existe.
- **FR-013**: Registros de log MUST NOT conter senha, código, token nem conteúdo de conversa.

### Key Entities

- **Usuário**: pessoa com conta (nome, e-mail, papéis, ativo/inativo). Vive no Keycloak; o Bonsai guarda a ligação com a líder dona dos dados.
- **Líder**: dona dos dados (já existe no banco); passa a corresponder a um usuário real.
- **Convite**: senha temporária de uso único (validade de 72 horas), ligada a um e-mail e a um papel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das chamadas da API sem credencial válida (exceto saúde) são recusadas.
- **SC-002**: Em teste com duas líderes, 0 registros de uma aparecem para a outra, pela tela ou pela API.
- **SC-003**: Um convidado conclui o primeiro acesso (senha + autenticador) em menos de 5 minutos.
- **SC-004**: A configuração do Keycloak para o Bonsai pode ser aplicada (e reaplicada) com um comando, sem cliques no painel.
- **SC-005**: Todos os testes anteriores continuam verdes.

## Assumptions

- **Keycloak** é o provedor de login e **já existe** (mantido fora deste projeto); o Bonsai só se conecta a ele e o configura. Nenhum Keycloak novo sobe no Docker do projeto.
- **Autenticador obrigatório para todos**, por se tratar de conversas de gestão de pessoas. Pode virar opcional por papel depois.
- **Cadastro só por convite**, com senha temporária repassada manualmente. Não existe servidor de e-mail; o link de convite por e-mail fica para quando houver.
- **Entrar com Google** deixa de ser simulado: some desta fase, voltando quando houver Google configurado no Keycloak (fora do escopo agora).
- Dados reais ainda **não** entram em uso: continua valendo "só conversas fictícias" até esta fase e as demais de segurança (criptografia, auditoria, LGPD) acabarem.
- Fora do escopo: criptografia dos dados, auditoria, retenção, consentimento LGPD, e-mail, login social, papel de RH.
- Produção (endereço público, HTTPS, Keycloak gerenciado) não está incluída; só o ambiente local.
