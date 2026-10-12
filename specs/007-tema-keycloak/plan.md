# Plano: Tema Bonsai no Keycloak

Spec: [spec.md](spec.md). Constitution check: tudo roda no Docker (o Keycloak de teste é um serviço à parte, fora do Compose do app); nenhum segredo no git; a identidade vem de `frontend/BRAND.md`.

| Escolha | Por quê |
| --- | --- |
| Tema de **login** que herda `keycloak.v2`, trocando só CSS, imagens, fontes e textos | Menos código para manter e acompanha atualizações do Keycloak. |
| Variáveis de cor/fonte copiadas do `tokens.css` (claro e escuro) e aplicadas por cima das variáveis do PatternFly | Mesmos valores da marca, sem inventar. |
| Fontes e logo dentro do arquivo (woff2 do `@fontsource` e SVG oficial) | Funciona sem internet e sem terceiros. |
| Entrega: um `.jar` gerado por `build.sh` (é um zip com `META-INF/keycloak-themes.json`) | O Coolify só precisa de um arquivo; não exige Java na máquina. |
| Teste: Keycloak 26 local em `infrastructure/keycloak/test/` (porta 8081, `start-dev`, tema montado como pasta, importa `bonsai-realm.json`) | Ver o tema de verdade antes de instalar na empresa. Descartável. |
| Textos em `messages_pt_BR.properties` (sobrescreve só o que muda) e idioma padrão `pt-BR` no reino | Erro de credenciais genérico (spec 003) e tom da marca. |

Pastas: `infrastructure/keycloak/theme/` (fonte do tema, `build.sh`, `dist/` ignorado no git) e `infrastructure/keycloak/test/`.
