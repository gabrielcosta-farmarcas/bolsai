# Implementation Plan: Responsabilidades do responsograma na evolução

**Spec**: [spec.md](spec.md) · **Date**: 2026-10-11

## Summary

Cada responsabilidade deixa de ser uma linha dentro de um texto e passa a ser um **registro próprio** (frase completa, título curto, posição). O cadastro usa **10 campos** (mínimo 3). A análise recebe **todas** as responsabilidades numeradas (R1, R2, …) e devolve cada observação ligada a **uma delas** (ou "fora"). A evolução mostra **todas as fileiras**, com histórico que sobrevive a novas versões do responsograma. Entrega em 3 etapas testáveis.

## Technical Context

- **Back**: Node 22 + TypeScript + Express + Prisma + Zod (já existentes); sem dependência nova.
- **Front**: React + Vite + Tailwind (já existentes); sem dependência nova.
- **IA**: o mesmo cliente de análise (`AiClient`), com saída estruturada validada por Zod. **Nova versão do prompt (v4)**; v1–v3 saem da lista (formato incompatível; não há análises antigas).
- **Banco**: 1 tabela nova (`responsibilities`) por migration (Regra IV). Não há dados a migrar (o conteúdo foi apagado em 2026-10-11).
- **Segurança**: tudo novo carrega `leader_id`, passa por `assertOwnsReport`, entra no teste de isolamento de duas líderes e nunca vai para os logs.

## Constitution Check

- Spec Kit seguido; Docker sem serviço novo; stack padrão; migration para o banco; dados locais protegidos (o apagamento foi autorizado e teve backup); linguagem simples; decisões técnicas do agente. Sem violações.

## Decisões técnicas

### Modelo de dados
1. **Tabela `responsibilities`** (por pessoa): `id` (UUIDv7), `leader_id`, `direct_report_id`, `position` (1–10), `text` (frase completa, até 1.000), `title` (até 60), `title_source` (`fallback` | `ai` | `leader`), `key` (texto normalizado: minúsculas, espaços colapsados), `retired_at` (nulo enquanto vale). Índice único `(direct_report_id, key)`.
2. **`responsibility_maps` continua** como histórico de versões (missão, texto composto, quem salvou/quando). O texto composto agora é gerado das responsabilidades ativas. O arquivo original **deixa de ser guardado** (o texto é o que importa; menos dado sensível guardado): a coluna e a rota de download saem de uso.
3. **Reconciliação ao salvar uma versão** (função pura, testada primeiro): para cada campo, procura pela `key`. Achou (ativa ou aposentada) → mantém o mesmo registro (reativa se estava aposentada) e atualiza a posição. Não achou → cria. Registro ativo que não veio mais → `retired_at`. Assim, o histórico acompanha o **texto**, não a posição.
4. **Regras**: 3 a 10 responsabilidades ativas por pessoa; cada texto de 3 a 1.000 caracteres, sem espaços sobrando; repetidos viram um só (com aviso). Conferidas na API (Zod + service); o servidor nunca confia na tela.

### Títulos curtos
5. Ao salvar, a resposta volta **na hora** com título provisório (começo da frase, até 60 caracteres, cortado em palavra). Em seguida, um trabalho em segundo plano pede à IA títulos para os itens novos e grava com `title_source='ai'` (só se a líder não tiver editado antes). Sem IA configurada ou com erro: fica o provisório, sem travar nada. A líder edita o título (`title_source='leader'`, que ninguém sobrescreve).

### Análise do 1:1
6. **Entrada para a IA** (`analysis-input.ts`): bloco `<missao>` (se houver) e bloco `<responsabilidades>` com **todas** as responsabilidades ativas, numeradas `R1: texto completo`, na ordem. Nada é cortado ou resumido (o único limite existente é o da transcrição). Se por algum motivo houver menos de 3 ou mais de 10, a análise é recusada com mensagem clara, em vez de seguir incompleta.
7. **Saída da IA** (prompt v4): cada item de `development_signals` traz `responsibility_ref` (`R1`…`Rn` ou `FORA`), `observation` e `kind`. A validação (junto às que já existem, com nova tentativa automática) rejeita referência que não esteja na lista enviada.
8. **Gravação**: ao concluir, o servidor troca `R3` pelo **id** da responsabilidade (`responsibility_id`, ou nulo para "fora") antes de salvar o JSON. O JSON guardado e o revisado passam a usar `responsibility_id`; o nome livre deixa de existir. O servidor confere que todo `responsibility_id` pertence à **mesma pessoa** (na análise e ao salvar a revisão).

### API
9. `POST /direct-reports` e `POST /direct-reports/:id/responsibility-maps` recebem `{ mission?, responsibilities: string[] }` (3–10).
10. `POST /responsibility-maps/extract` (arquivo; não depende de pessoa, para servir também em "Nova pessoa"): lê o texto, separa em parágrafos e **devolve a proposta** (`mission?`, `responsibilities`, `leftOut`) **sem salvar nada**, para a líder conferir nos campos.
11. `GET /direct-reports/:id/responsibilities` (ativas; `?retired=true` inclui as aposentadas) e `PATCH /responsibilities/:id` (`{ title }`).
12. `GET /direct-reports/:id/timeline` passa a devolver `responsibilities` (todas as ativas, com `points` por encontro, cada um com a observação), `retired` (aposentadas com histórico) e `unassigned` (observações "fora").

### Tela
13. **Cadastro**: componente `ResponsibilityFields` com 10 campos "Responsabilidade 1…10", contador "N preenchidas (mínimo 3)", erro claro, botão **Preencher a partir de um arquivo**. Usado em "Nova pessoa" e em "Nova versão do responsograma" (pré-preenchido com as atuais).
14. **Revisão da análise**: cada observação ganha um seletor com as responsabilidades (título) e "Fora das responsabilidades".
15. **Evolução**: uma fileira por responsabilidade (título + camadas por encontro); botão que **abre** a frase completa e as observações; "ainda não conversado" quando vazia; seções recolhidas "Fora das responsabilidades" e "Responsabilidades anteriores"; edição inline do título. Segue `frontend/BRAND.md`, teclado e leitor de tela (`aria-expanded`).

## Etapas (cada uma entra no ar sozinha)

- **A — Cadastro por campos e responsabilidades como registro**: migration, reconciliação, API (criar pessoa, nova versão, extrair do arquivo, listar, editar título), títulos em segundo plano, tela de cadastro.
- **B — Análise por responsabilidade**: prompt v4, entrada com todas as responsabilidades, validação e conversão `Rn → id`, revisão com seletor.
- **C — Evolução**: linha do tempo nova, tela com as fileiras, expansão, "ainda não conversado", seções recolhidas, edição de título; limpeza dos textos antigos, documentação e `templates/`.

## Project Structure

```text
specs/005-responsabilidades-do-responsograma/   spec.md · plan.md · tasks.md

backend/node/
├── prisma/migrations/…_responsibilities/       # tabela responsibilities
├── prompts/analysis-1on1.v4.md                 # v1–v3 arquivadas em prompts/arquivo/
└── src/modules/
    ├── responsibilities/        # reconcile.ts · titles.ts · routes · controller · service · repository (+ testes)
    ├── responsibility-maps/     # versão passa a salvar via reconciliação; extract; sem arquivo original
    ├── direct-reports/          # criar com responsibilities: string[] (3–10)
    ├── analyses/                # analysis-input.ts · analysis.schema.ts · evaluation.ts (refs R1…Rn)
    └── timeline/                # linha do tempo por responsabilidade

frontend/react/src/features/
├── responsibilities/            # ResponsibilityFields · hooks · tipos
├── direct-reports/              # formulário e seção usam os campos
├── analysis-review/             # seletor de responsabilidade por observação
└── timeline/                    # ResponsibilityEvolution novo
```

## Testes (antes do código, em cada etapa)

- **Reconciliação**: igual ignorando maiúsculas e espaços; mudou de posição; editada vira nova; removida aposenta; volta a ser igual reativa; repetidos.
- **Regras**: menos de 3, mais de 10, vazio, curto, longo, repetido.
- **Títulos**: provisório correto; IA preenche só o que ninguém editou; falha da IA não impede salvar.
- **Análise**: o texto enviado à IA contém **todas** as responsabilidades preenchidas (SC-002a); referência inválida é rejeitada e refeita; `FORA` aceito; id de outra pessoa recusado.
- **Isolamento**: as rotas novas entram no teste de duas líderes; administrador e liderado recebem 403.
- **Tela**: mínimo de 3 com mensagem; preencher por arquivo; seletor na revisão; fileiras, expansão, "ainda não conversado".
- **Conferência real**: cadastrar a Ellen com 4 responsabilidades, analisar um 1:1 fictício e ver a evolução.

## Riscos e pontos de atenção

- **A IA pode apontar para a responsabilidade errada.** A revisão da líder é a salvaguarda: o seletor permite corrigir antes de salvar a versão final.
- **Títulos feitos pela IA saem do seu ambiente** (como a análise); com dados reais, vale a mesma condição de LGPD.
- **Prompt v4 precisa de avaliação**: usar o roteiro de avaliação existente (`evaluate-prompt`) com um caso novo antes de dar por pronto.
- **Muitas responsabilidades iguais com palavras diferentes** contam como itens distintos; a líder pode editar o texto para unificar.
