# Research

- **Decision**: coluna própria `behaviors TEXT NULL` em `responsibility_maps`. **Rationale**: é o que a missão já faz; o histórico por versão vem de graça. **Alternatives**: tabela separada de comportamentos (um por linha) — mais código e a spec pede texto único; guardar em `leader_settings` — perderia o histórico e não seria por pessoa.
- **Decision**: enviar à IA como bloco próprio `<comportamentos_desejados>` dentro de `<responsograma>`, logo após `<responsabilidades>`. **Rationale**: o prompt já trata tudo dentro de tags como dado, não como instrução. **Alternatives**: misturar no texto das responsabilidades — confunde a numeração R1…Rn.
- **Decision**: limite de 3.000 caracteres validado na API (Zod) e na tela. **Rationale**: o exemplo real tem ~400; evita custo e abuso. **Alternatives**: sem limite — deixa a entrada da IA imprevisível.
- **Decision**: editar só os comportamentos cria nova versão (como mudar só a missão). **Rationale**: o histórico mostra o que valia e as responsabilidades continuam pela chave do texto, sem perder camadas.
- **Decision**: o texto composto da versão (`text`) passa a incluir a seção "COMPORTAMENTOS DESEJADOS" quando preenchida. **Rationale**: mantém `text` como retrato completo da versão.
- **Decision**: prompt padrão com 2 linhas novas; quem colou prompt próprio em Configurações cola a nova versão. **Rationale**: o prompt já ensina a usar tags como dado; o uso dos comportamentos precisa estar dito para a IA não os ignorar nem dar nota.
