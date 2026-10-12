# Identidade visual — Bonsai · "Camadas"

Padrão **obrigatório** de todo o projeto (telas existentes e novas). Se algo não estiver coberto aqui, siga a referência visual "Bonsai Camadas.html" (entregue pelo design) e **pergunte antes de criar algo novo**.

Arquivos oficiais da marca ficam em `frontend/react/public/brand/` (SVG: símbolo, favicon, ícone de app). Não redesenhe o símbolo.

## Onde está no código

| O quê | Onde |
| --- | --- |
| Tokens (cores, fontes, escala tipográfica, pesos, espaçamento, raios, alturas, logo; claro e escuro) | `frontend/react/src/styles/tokens.css` (arquivo único, cópia do `tokens.css` do design sem alterar valores) |
| Base e classes de texto (`.text-h1`, `.text-body`...) | `frontend/react/src/styles/globals.css` (mesmo conteúdo do design, dentro de `@layer`) |
| Logo | `<Logo variant="horizontal \| vertical \| simbolo" />` em `src/components/ui/Logo.tsx` |
| Favicon e ícone de app | `index.html` e `public/manifest.webmanifest` |

Tema: segue `prefers-color-scheme`; `.dark` / `[data-theme="dark"]` forçam o escuro e `.light` / `[data-theme="light"]` o claro.

**Atualizar os tokens:** copie o novo `tokens.css` do design e refaça só duas adaptações (descritas no topo do arquivo): o primeiro bloco `:root` vira `@theme static`, e a seção "Base" e os "Estilos de texto" ficam em `globals.css`. Nenhum valor muda.

**Nunca** use cor, tamanho de fonte, espaçamento ou raio fixo no código: sempre os tokens (`bg-primary`, `text-body`, `rounded-lg`, `h-[var(--control-h)]`, `var(--token)`).

## Cores (claro / escuro)

Use só estes tokens (classes Tailwind entre parênteses). Não invente cores.

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `primary` (Musgo) | #2E5A4C | #8CC2AE | ação principal, links, item ativo |
| `on-primary` | #FFFFFF | #10201A | texto sobre `primary` (e sobre `danger`) |
| `primary-subtle` | #E4ECE7 | #22302A | item ativo, avatar, hover |
| `accent` (Argila) | #B8714F | #E0A07F | só decorativo (borda, marca); nunca texto |
| `accent-text` | #94512F | #E0A07F | texto em argila |
| `accent-subtle` | #F3E6DE | #3A2A22 | etiqueta de "combinado" (com `accent-text`) |
| `liquen` | #DCE6DF | #22302A | superfície de apoio |
| `bg` | #F6F5F1 | #131715 | fundo da página |
| `surface` | #FFFFFF | #1B201E | cards, barra superior, campos |
| `border` | #DEDBD2 | #2C3330 | bordas de 1 px |
| `border-strong` | #8C928D | #67716B | contorno de campos |
| `text` | #1D2420 | #E7EAE6 | texto |
| `text-muted` | #5C655F | #A2ABA5 | texto secundário |
| `success` | #3C7A3E | #8FCB8A | sucesso (evolução) |
| `warning` | #9A6200 | #E2B15A | atenção |
| `success-subtle` | #E3EEDF | #1F3020 | fundo de sucesso |
| `warning-subtle` | #F6EBD3 | #362B17 | fundo de atenção |
| `danger` | #B03A35 | #F08C84 | erro, excluir |
| `danger-subtle` | #F6E2E0 | #3A2120 | fundo de erro |

Contraste de texto mínimo 4,5:1 (WCAG AA). Cuidados: `accent` não é texto; no tema claro, texto `success` não vai sobre `primary-subtle` ou `success-subtle`, e texto `warning` não vai sobre `warning-subtle` (4,3:1): use `primary` ou `text` ali. `border-strong` fica em ~3:1 sobre `surface` (contorno de campo).

## Tipografia

- **Alegreya Sans 500** (`--font-display`): logotipo e títulos (`h1`–`h3` já usam, sem classe).
- **Source Sans 3**, 400 e 600 (`--font-body`): texto, formulários e interface.
- Escala (tamanho/entrelinha): display 40/1,1 · h1 30/1,15 · h2 24/1,2 · h3 19/1,25 (Alegreya) · body-lg 17/1,55 (leitura longa: transcrição, resumo) · body 15/1,5 (padrão) · body-sm 14/1,45 · label 14/600 (rótulos e botões) · caption 13 (metadados, datas) · overline 12/600 maiúsculas.
- Use as classes `.text-display`, `.text-h1`…`.text-overline` (ou `--fs-*`/`--lh-*`). Não crie tamanhos fora da escala.
- Fontes self-hosted (`@fontsource`); não use pesos que não foram carregados.

## Medidas

Espaçamento base 4 (`--space-*`, igual à escala do Tailwind); raios `--radius-sm` 6, `md` 8 (botões e campos), `lg` 12 (cards), `xl` 16 (modais, card de login), `full` 999 (etiquetas, avatar); controles `--control-h` 44 px e `--control-h-sm` 36 px; barra superior `--topbar-h` 64 px; largura de leitura `--reading-max` 68ch (`max-w-reading`). As páginas do app são fluidas (usam a largura toda, margem de 32 px alinhada ao logo), com colunas de informação onde há espaço; `--content-max` (1200 px, `max-w-page`) fica para conteúdo que precisa de teto, não para as páginas. Foco: `--focus-ring`, aplicado por `:focus-visible` (não remova).

## Logo

- Símbolo: sempre com o tronco, nos SVGs oficiais.
- Logotipo: "bonsai" em minúsculas, Alegreya Sans 500, com o pingo do i trocado por uma pílula na cor do símbolo (`bonsaı`, ı = U+0131; pílula 0,24em × 0,115em, 0,17em do topo, centralizada).
- Horizontal: fonte = 0,74 × altura do símbolo; espaço = 0,26 × altura. Barra superior: símbolo com 28 px.
- Vertical: fonte = 0,5 × altura do símbolo. Use na tela de login, com a frase "cuidado contínuo, crescimento visível".
- Mínimos: símbolo 16 px; logo horizontal 72 px de largura.
- Sem sombra, gradiente, contorno ou rotação; não troque as cores. Em fundo escuro: #8CC2AE no símbolo e #E7EAE6 no texto (o componente já faz isso). Monocromático: só #1D2420 (`tone="black"`) ou só #FFFFFF (`tone="white"`).
- Favicon: `favicon-16.svg` no claro, `favicon-16-escuro.svg` no escuro. Ícone de app: `bonsai-icone-musgo.svg`.

## Estilo da interface

- Calmo, com bastante espaço em branco. Separe áreas com bordas de 1 px (`border-border`), **sem sombras**.
- Cantos: 8 px em botões e campos (`rounded-md`), 12 px em cards (`rounded-lg`), 999 px em etiquetas (`rounded-full`).
- Botão principal: `primary` com `on-primary`. Etiqueta de "combinado": `accent-subtle` com `accent-text`.
- Sem gradientes, emojis nem ilustrações de folhas, vasos, tesouras ou elementos "orientais".

## Tom de voz (português do Brasil)

- Sereno, acolhedor e direto.
- Prefira **encontro, combinado, pauta, evolução**. (Na interface: "Pessoas", "Encontros", "Combinados".)
- Evite linguagem de controle ou avaliação: "desempenho", "nota", "monitorar", "cobrança".
