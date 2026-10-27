# Research: Anotações sobre pessoas

## Onde guardar passos
- **Decision**: tabela própria `note_steps` (uma linha por passo, com posição).
- **Rationale**: cada passo tem prazo, responsável, estado e vínculo com Combinado; precisa ser consultado e alterado individualmente.
- **Alternatives**: lista em JSON dentro da anotação (descartada: difícil de consultar e de garantir o vínculo com Combinado).

## Situação da anotação
- **Decision**: calculada: `resolved_at` preenchido → Resolvida; senão, com ao menos 1 passo → Em andamento; senão → Sem plano.
- **Rationale**: fica sempre coerente com os passos. Mesmo princípio do "atrasado" dos Combinados (calculado, não guardado).
- **Alternatives**: coluna de status (descartada: pode divergir dos passos).

## Responsável do passo
- **Decision**: reaproveitar o enum de dono dos Combinados (`leader` = a líder, `report` = a pessoa). Padrão `leader`.
- **Rationale**: promover a Combinado fica uma cópia direta, sem tradução.
- **Alternatives**: texto livre (descartada: não mapeia para Combinado).

## Promover passo a Combinado
- **Decision**: o service de notas chama o repositório de Combinados (`create`, `origin: leader`, confirmado) e grava o id no passo (`agreement_id`). Segunda tentativa devolve o vínculo existente, sem criar outro.
- **Rationale**: Combinado real aparece em Combinados, na preparação e nas análises como qualquer outro.
- **Alternatives**: duplicar o dado num campo (descartada).

## Levar para o próximo encontro
- **Decision**: coluna booleana `bring_to_next_session` na anotação; a aba Preparar lista as anotações marcadas e não resolvidas, lidas direto do banco. Resolver desmarca.
- **Rationale**: a preparação gerada pela IA é um retrato salvo; as anotações precisam aparecer sempre atualizadas e a IA não deve lê-las nesta versão.
- **Alternatives**: incluir na entrada da IA (descartada: fora do escopo e mistura notas privadas com a análise).

## Exclusão
- **Decision**: exclusão lógica (`deleted_at`) na anotação; os passos acompanham (lidos só via anotação não excluída).
- **Rationale**: regra de exclusão lógica do projeto (FR-011).

## Acesso
- **Decision**: toda leitura e escrita filtra por `leader_id` da líder logada e por pessoa não excluída; função `canViewNote` ao lado das demais em `authorization.ts`. Dono errado responde "não encontrada".
- **Rationale**: mesmo padrão já testado em `isolation.integration.test.ts`.

## Nomes na API
- **Decision**: código em inglês (`notes`, `steps`), textos da tela em português.
- **Rationale**: convenção do projeto.
