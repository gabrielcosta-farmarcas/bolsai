# Feature Specification: Configurações do perfil

**Feature Branch**: `001-bonsai-mvp1` (continua na branch atual)
**Created**: 2026-10-12
**Status**: Draft
**Input**: "Uma opção de configurações do meu perfil, com: alterar a minha chave de API do Claude, alterar o modelo utilizado e editar o prompt utilizado. Por enquanto é isso."

Hoje a chave, o modelo e o prompt da IA ficam fixos na instalação (arquivo de ambiente e arquivo de prompt). Esta funcionalidade os leva para uma tela, para a líder ajustar sozinha, sem mexer em arquivos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trocar a chave de API do Claude (Priority: P1)

Na tela **Configurações**, a líder vê se já existe uma chave cadastrada (sem ver a chave inteira, só o final, como "•••• 4f2a") e pode **cadastrar uma nova** ou **remover** a atual. A análise passa a usar a chave que ela cadastrou.

**Why this priority**: sem chave a análise não roda; é a configuração que destrava o uso real da IA.

**Independent Test**: cadastrar uma chave válida, analisar um 1:1 e ver a análise concluir; cadastrar uma chave inválida e ver o aviso claro, sem perder a anterior.

**Acceptance Scenarios**:

1. **Given** nenhuma chave cadastrada, **When** a líder abre Configurações, **Then** vê "Nenhuma chave cadastrada" e um campo para colar a chave.
2. **Given** uma chave nova colada, **When** a líder salva, **Then** o Bonsai confere se a chave funciona; se sim, guarda e mostra só o final dela ("•••• 4f2a") com a data da troca.
3. **Given** uma chave que a Anthropic recusa, **When** a líder tenta salvar, **Then** nada é gravado e ela vê "Esta chave não foi aceita pela Anthropic. Confira se copiou inteira." (a chave antiga continua valendo).
4. **Given** uma chave cadastrada, **When** a líder abre a tela de novo, **Then** a chave **nunca** aparece por inteiro, nem na tela nem nas respostas do servidor.
5. **Given** uma chave cadastrada, **When** a líder escolhe Remover e confirma, **Then** a chave é apagada e a análise avisa que falta configurar a chave (ou usa a chave padrão da instalação, se houver — ver Premissas).

---

### User Story 2 - Escolher o modelo (Priority: P1)

A líder escolhe, numa lista, **qual modelo do Claude** faz as análises e as sugestões de título. A escolha vale para as próximas análises; as antigas não mudam.

**Why this priority**: o modelo muda qualidade, velocidade e custo, e hoje ele não está definido.

**Independent Test**: escolher um modelo, analisar um 1:1 e ver, nos dados da análise, que foi aquele modelo que respondeu.

**Acceptance Scenarios**:

1. **Given** a tela Configurações, **When** a líder abre a lista de modelos, **Then** vê os modelos disponíveis com um nome simples e uma frase curta sobre cada um (ex.: "mais capaz", "mais rápido e barato").
2. **Given** um modelo escolhido e salvo, **When** a líder analisa um encontro, **Then** a análise usa esse modelo.
3. **Given** nenhum modelo escolhido, **When** a líder analisa, **Then** o Bonsai usa o modelo padrão da instalação; se não houver, avisa "Escolha um modelo em Configurações".
4. **Given** um modelo que a chave cadastrada não pode usar, **When** a análise roda, **Then** a líder vê a mensagem de falha com o motivo em linguagem simples (não um erro técnico).

---

### User Story 3 - Editar o prompt da análise (Priority: P2)

A líder vê o **texto do prompt** (as instruções que a IA segue ao analisar) numa caixa de texto grande, pode **editar e salvar**, e pode **voltar ao padrão** do Bonsai a qualquer momento. As próximas análises usam o texto salvo.

**Why this priority**: permite ajustar o tom e as regras da análise sem mexer no código; é P2 porque o prompt padrão já funciona.

**Independent Test**: editar o prompt (por exemplo, pedir resumos de até 3 linhas), analisar um 1:1 e conferir o efeito; clicar em "Voltar ao padrão" e ver o texto original de volta.

**Acceptance Scenarios**:

1. **Given** a líder nunca editou, **When** abre Configurações, **Then** vê o prompt padrão do Bonsai, marcado como "Padrão".
2. **Given** um texto editado, **When** a líder salva, **Then** as próximas análises usam esse texto e a tela mostra "Personalizado".
3. **Given** um prompt personalizado, **When** a líder escolhe "Voltar ao padrão" e confirma, **Then** o texto personalizado é descartado e o padrão volta a valer.
4. **Given** um prompt vazio ou curto demais, **When** a líder tenta salvar, **Then** o Bonsai não salva e explica o mínimo necessário.
5. **Given** o prompt editado, **When** a líder abre a tela, **Then** vê um aviso: "O formato da resposta é fixo e não depende deste texto; mudar as instruções pode alterar a qualidade da análise. Você pode voltar ao padrão a qualquer momento."
6. **Given** análises já feitas, **When** a líder muda o prompt, **Then** elas não são refeitas nem alteradas.

---

### Edge Cases

- Salvar a chave **durante** uma análise em andamento: a análise em andamento termina com a chave antiga; as próximas usam a nova.
- Colar a chave com espaços ou quebra de linha no começo ou no fim: o Bonsai limpa antes de conferir.
- Sem internet ao conferir a chave: avisa "Não conseguimos falar com a Anthropic agora. Tente de novo." e não grava.
- Duas abas abertas, uma altera o prompt: vale a última a salvar (sem bloquear).
- Prompt muito grande: há um limite de tamanho, com aviso claro ao passar dele.
- Quem entra sem o papel de líder não vê nem altera nada disso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Bonsai MUST ter uma tela **Configurações**, acessível pelo menu, com três blocos: chave de API, modelo e prompt.
- **FR-002**: A líder MUST poder **cadastrar, trocar e remover** a chave de API do Claude. Ao cadastrar ou trocar, o Bonsai MUST conferir que a chave funciona **antes** de gravar; chave recusada não é gravada.
- **FR-003**: A chave MUST NOT aparecer por inteiro em nenhuma tela, resposta do servidor, log ou mensagem de erro depois de salva; só os **4 últimos caracteres** e a data da última troca.
- **FR-004**: A chave MUST ser guardada **cifrada** no banco (nunca em texto puro).
- **FR-005**: A líder MUST poder **escolher o modelo** numa lista de modelos conhecidos. A escolha MUST valer para a análise do 1:1 e para a sugestão de títulos das responsabilidades.
- **FR-006**: A líder MUST poder **ver, editar, salvar e voltar ao padrão** o prompt da análise. O Bonsai MUST indicar se está em uso o **Padrão** ou o **Personalizado**.
- **FR-007**: O prompt personalizado MUST ter tamanho mínimo e máximo, com mensagem clara fora deles.
- **FR-008**: A análise MUST usar, nesta ordem: o que a líder configurou; se faltar, o padrão da instalação (arquivo de ambiente para chave e modelo; arquivo de prompt para o prompt); se não houver nenhum, avisar em português simples o que falta configurar.
- **FR-009**: As configurações MUST ser **por líder**: uma líder nunca vê nem usa a chave, o modelo ou o prompt de outra.
- **FR-010**: Alterar a configuração MUST NOT alterar análises já feitas; vale só para as próximas.
- **FR-011**: O texto do prompt e a chave MUST NOT ir para os logs.
- **FR-012**: Todo texto e visual da tela MUST seguir a identidade Bonsai (`frontend/BRAND.md`) e os padrões de acessibilidade das outras telas (teclado, rótulos, avisos legíveis).

### Key Entities

- **Configuração da líder**: chave de API do Claude (cifrada, com os 4 últimos caracteres e a data da troca), modelo escolhido e prompt personalizado (vazio = usar o padrão). Uma por líder.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A líder cadastra uma chave nova, escolhe o modelo e faz uma análise **sem abrir nenhum arquivo nem terminal**, em menos de 2 minutos.
- **SC-002**: Em testes automatizados, a chave completa não aparece em nenhuma resposta da API, log ou mensagem de erro em 100% dos casos (cadastro, leitura, troca, remoção e falha).
- **SC-003**: Uma chave recusada deixa a configuração anterior **intacta** em 100% das tentativas.
- **SC-004**: Depois de "Voltar ao padrão", a análise usa exatamente o texto padrão (teste que confere o conteúdo enviado à IA).
- **SC-005**: Duas líderes com configurações diferentes nunca usam a configuração uma da outra (teste de isolamento).
- **SC-006**: Todos os testes anteriores continuam verdes.

## Assumptions

- **Por líder, não para o sistema todo**: cada líder tem a própria chave, o próprio modelo e o próprio prompt (o projeto já isola tudo por líder). *Decisão do agente; se o Bonsai passar a ser usado por uma equipe com uma chave compartilhada, isso pode virar uma configuração do administrador numa evolução futura.*
- **O padrão da instalação continua existindo**: `ANTHROPIC_API_KEY` e `ANTHROPIC_MODEL` no arquivo de ambiente e o arquivo `prompts/analysis-1on1.md` viram o **valor de reserva** usado quando a líder não configurou nada. Assim, nada que funciona hoje quebra.
- **A lista de modelos** é uma lista curta e fixa dos modelos atuais do Claude, mantida no código; a líder não digita o nome do modelo. Quando sair um modelo novo, entra na lista numa atualização.
- **Segurança**: a chave fica cifrada com o mesmo mecanismo já usado para as sessões de login. A proteção mais ampla de dados (auditoria, retenção, LGPD) continua na Fase 3 da spec 003.
- **O prompt personalizado é um texto único** (o mesmo prompt da análise do 1:1). Não há histórico de versões nem seletor de versão (decisão de 2026-10-12: o prompt é único). O padrão do Bonsai fica sempre disponível para restaurar.
- **O formato da resposta da IA é fixo** (definido pelo sistema, independente do prompt), então editar o prompt não quebra a tela, só muda o conteúdo.
- **"Meu perfil"** nesta primeira entrega contém só estas três opções; dados pessoais (nome, e-mail, foto, senha) ficam com o Keycloak e fora do escopo.
- Fora do escopo: administrador configurar por outras pessoas, histórico de versões do prompt, testar o prompt em uma conversa de exemplo, mostrar custo ou consumo de uso, outros provedores de IA, e o prompt da preparação do próximo 1:1 (que ainda não existe).
