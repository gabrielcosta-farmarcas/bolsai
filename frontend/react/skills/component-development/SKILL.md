---
name: component-development
description: >-
  Define o caminho obrigatório para construir frontend React estruturado:
  pastas, tipos de componente, contrato de props, estado, hooks, composição,
  acessibilidade e checklist de conclusão. O visual Tailwind fica na skill
  styling-tailwind. Use ao criar, alterar ou revisar componentes, páginas,
  hooks ou a estrutura de uma interface React.
---

# Desenvolvimento de componentes React

Esta skill é o norte para estrutura, responsabilidade e comportamento. Siga os passos na ordem. Todo componente visível usa Tailwind pela skill `frontend/react/skills/styling-tailwind/SKILL.md`: leia as duas ao criar tela ou componente, nesta ordem.

## Quando aplicar

Leia esta skill antes de:

- criar uma página, feature ou componente;
- extrair um trecho de JSX para um componente novo;
- adicionar estado, efeito, hook ou chamada de API na UI;
- revisar um componente que mistura busca de dados, regra de negócio e markup.

## Passos obrigatórios

1. Nomeie a responsabilidade em uma frase. Se a frase tiver "e" entre duas responsabilidades, separe em dois componentes.
2. Classifique o artefato: página, feature, componente de UI ou hook.
3. Coloque o arquivo na pasta da classificação abaixo.
4. Declare o contrato em TypeScript antes de escrever o JSX.
5. Implemente o componente como função nomeada. Dados e callbacks entram por props.
6. Aplique o visual com a skill `styling-tailwind`: tokens, `cn` e primitivo de UI.
7. Trate carregamento, vazio e erro no mesmo fluxo da feature.
8. Use HTML semântico e garanta teclado e rótulos.
9. Percorra o checklist de conclusão antes de encerrar.

## Estrutura de pastas

A aplicação React vive em `src/` com esta árvore:

```text
src/
  app/                         # rotas e páginas finas
  components/
    ui/                        # primitivos sem regra de negócio
    layout/                    # casca: header, sidebar, page shell
  features/
    <feature>/
      components/              # componentes da feature
      hooks/                   # estado e acesso a dados da feature
      types.ts
      index.ts                 # API pública da feature
  hooks/                       # hooks usados por mais de uma feature
  lib/                         # funções puras, sem JSX
  types/                       # tipos compartilhados entre features
```

Regras de colocação:

- Página em `app/` só compõe features e layout. Sem fetch, sem validação, sem formatação de regra de negócio.
- Componente usado por uma única feature fica em `features/<feature>/components/`.
- Componente sobe para `components/ui/` somente quando uma segunda feature precisa dele e ele não conhece o domínio.
- Hook sobe para `src/hooks/` somente quando duas features usam a mesma lógica.
- Função sem JSX fica em `lib/` ou no hook da feature. Não crie componente para esconder cálculo.
- `index.ts` exporta só a API pública da feature. Não crie barrel que reexporta `components/ui` inteiro.

## Tipos de componente

| Tipo | Onde vive | Pode | Não pode |
| --- | --- | --- | --- |
| Página | `app/` | compor layout e features, ler params de rota | buscar API, validar formulário, decidir regra de negócio |
| Feature | `features/<feature>/components/` | orquestrar hook da feature e componentes de UI | importar outra feature por dentro da pasta dela |
| UI | `components/ui/` | renderizar props, emitir callbacks | conhecer endpoint, entidade de negócio ou store global |
| Layout | `components/layout/` | estruturar regiões da página | conter regra de uma feature |

Features se comunicam pela API pública (`features/<feature>/index.ts`) ou por props vindas da página. Sem import cruzado de `features/a/components` dentro de `features/b`.

## Contrato do componente

- Um componente por arquivo. O nome do arquivo é o nome do componente em PascalCase: `InvoiceStatus.tsx`.
- Componente é `export function`. Sem classe, sem default export.
- Props em type alias `{Nome}Props` no mesmo arquivo. Exporte o type quando outro módulo precisar montar as props.
- Campos obrigatórios ficam obrigatórios. Opcional só quando a ausência tem comportamento definido.
- Callbacks de props usam `on` + verbo: `onRetry`, `onSubmit`. Handlers internos usam `handle` + verbo: `handleRetry`.
- Booleanos usam prefixo `is`, `has` ou `can`: `isDisabled`, `hasError`.
- Sem `any`, `Object` ou props do tipo `object` genérico. Modele o dado que o JSX realmente lê.
- Sem espalhar `...props` em componente de domínio. Em primitivo de UI, documente quais atributos nativos são aceitos e tipe-os com `ComponentPropsWithoutRef<"button">` (ou o elemento correspondente).
- Valor derivado se calcula no render. Não grave derivação em estado.

Forma mínima:

```tsx
type InvoiceStatusProps = {
  status: "paid" | "open" | "overdue";
  onRetry?: () => void;
};

export function InvoiceStatus({ status, onRetry }: InvoiceStatusProps) {
  if (status === "overdue" && onRetry) {
    return (
      <button
        type="button"
        className="bg-primary text-on-primary rounded-md px-3 py-2"
        onClick={onRetry}
      >
        Tentar cobrança novamente
      </button>
    );
  }

  return <p className="text-text">{labelByStatus[status]}</p>;
}
```

## Estado e efeitos

Decida o dono do estado antes de criar `useState`:

- Estado de interação local (aberto, aba ativa, campo) fica no componente que desenha a interação.
- Estado de tela de uma feature fica no hook `features/<feature>/hooks/use<Feature>.ts`.
- Dado de servidor nasce nesse hook. O componente recebe `{ data, isLoading, error }` e callbacks. Não copie a resposta da API para outro `useState`.
- Estado usado por várias features e que muda pouco (sessão, tema) pode ir para um contexto próprio em `src/`. Contexto não guarda lista que atualiza a cada tecla.
- Prop drilling atravessa no máximo dois níveis. No terceiro, componha via `children` ou um contexto limitado à feature.

Efeitos:

- `useEffect` sincroniza com sistema externo: subscription, timer, foco inicial, integração com API do browser.
- Transformar props em estado ou buscar dado que a feature já pode receber no hook não usa efeito.
- Todo efeito com subscription, timer ou listener devolve a função de limpeza.
- Dependências do efeito são completas. Não desligue o lint para "fazer funcionar".

Hooks:

- Hook customizado quando a lógica se repete ou quando o componente passa a ter mais de uma razão para mudar.
- Nome `use` + domínio: `useInvoiceFilters`. Retorno é objeto nomeado, não array posicional, quando há mais de dois valores.
- Hook não retorna JSX.

Memoização (`memo`, `useMemo`, `useCallback`) entra depois de uma medição ou quando a referência estável é contrato de um filho documentado. Não envolva todo handler por padrão.

## Composição

- Prefira `children` e componentes filhos a booleanos que ligam pedaços de UI (`showHeader`, `showFooter`, `variant` com cinco layouts).
- Lista com markup próprio vira componente de item: `InvoiceList` e `InvoiceListItem`.
- `key` é id estável do domínio. Índice do array só em lista estática que não reordena, filtra ou insere.
- Condicional complexa sai do JSX para uma função com nome ou para um componente filho.
- Formulário pequeno usa estado controlado no hook da feature. Validação e submit acontecem nesse hook; o componente de campo só exibe valor, erro e `onChange`.
- Erro de campo aparece junto do campo, associado por `aria-describedby`.

## Acessibilidade e semântica

- Ação usa `<button type="button">`. Navegação usa `<a href>`. Div com `onClick` não substitui nenhum dos dois.
- Todo input tem `<label htmlFor>` ou `aria-label`.
- Imagem informativa tem `alt` com o conteúdo. Imagem decorativa tem `alt=""`.
- Título da página e headings seguem a ordem, sem pular nível para ajustar tamanho.
- Ícone clicável tem nome acessível. Cor não é o único sinal de estado.
- Foco visível permanece. Diálogo fecha com Escape, prende o foco e devolve o foco ao elemento que abriu.
- Texto de botão descreve a ação. "Ok" e "Clique aqui" não servem quando a tela tem mais de uma ação.

## Estados de interface

Toda feature que busca ou envia dados implementa os quatro estados no componente de feature:

- **carregando**: região com status, sem layout quebrado;
- **vazio**: explica o que está vazio e qual ação existe;
- **erro**: mostra a falha e oferece a ação de tentar de novo quando a operação for repetível;
- **sucesso**: renderiza os dados.

O primitivo de UI recebe o estado já resolvido por props (`isLoading`, `errorMessage`). Ele não decide de onde veio o erro.

Limites de erro (`ErrorBoundary`) ficam na página ou na raiz da feature, não em cada botão.

## Design com Tailwind

A skill `frontend/react/skills/styling-tailwind/SKILL.md` é obrigatória para o desenho da aplicação. Ela define tokens, `cn`, variantes e onde a classe mora. Esta skill só aponta o vínculo.

- Página, feature, UI e layout que aparecem na tela recebem classes Tailwind. Sem CSS por componente e sem `style` para cor, espaçamento ou tipografia.
- Botão, campo, badge e casca da página são primitivos (`Button`, `TextField`, `StatusBadge`, layout). As classes ficam nesses arquivos, em `components/ui/` e `components/layout/`.
- Feature e página importam o primitivo. Não copiam a string de classes para recriar o mesmo papel.
- Cor e raio usam token semântico (`bg-primary`, `text-text`, `border-border`, `rounded-md`), definidos no `@theme` da skill de Tailwind.

Tela ou componente novo: termine a estrutura desta skill e aplique o visual na skill de Tailwind antes do checklist.

## Nomeação

- Componentes e tipos: PascalCase.
- Hooks, funções, variáveis e props: camelCase.
- Pastas de feature: kebab-case (`invoice-list`).
- Arquivos de componente: PascalCase. Arquivos de hook: camelCase (`useInvoiceList.ts`).
- Sem abreviações opacas (`btn`, `usr`, `comp1`).
- Prefixo de componente de UI descreve o papel (`TextField`, `StatusBadge`), não o visual (`RedButton`).

## Checklist de conclusão

- [ ] A responsabilidade cabe em uma frase e o arquivo está na pasta correta.
- [ ] Página fina; fetch e regra estão no hook da feature; UI só renderiza props.
- [ ] Props tipadas, sem `any`, callbacks `on*`, handlers `handle*`.
- [ ] Carregamento, vazio e erro existem na feature que fala com dados.
- [ ] Lista usa key estável; condicional longa não está inline no JSX.
- [ ] Botão, link, label, alt e foco estão corretos.
- [ ] Efeito, se existir, sincroniza sistema externo e limpa a subscription.
- [ ] Nenhum import atravessa a pasta interna de outra feature.
- [ ] Visual segue `styling-tailwind`: token semântico, `cn` quando há variante, primitivo de UI em vez de classe copiada na feature.

## Limites desta skill

- Tokens, classes Tailwind, variantes e primitivos visuais: `frontend/react/skills/styling-tailwind/SKILL.md`.
- Esta skill não escolhe biblioteca de data fetching, formulário ou roteamento. O limite é o mesmo com qualquer uma delas: página fina, hook da feature como dono dos dados, UI sem endpoint.
