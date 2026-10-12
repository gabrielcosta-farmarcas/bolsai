# Keycloak do Bonsai

O Bonsai usa o Keycloak da empresa (`https://auth.coolify.radar.farmarcas.com.br`) como motor de autenticação, em um reino próprio chamado **`bonsai`**. Nada foi alterado no reino `master` nem em outros reinos.

## O que está configurado (aplicado em 2026-10-11, pelo painel)

| Item | Valor |
| --- | --- |
| Reino | `bonsai` |
| Papéis | `lider` (dados próprios) e `administrador` (gerencia usuários, sem ler 1:1) |
| Cliente | `bonsai-web` (**confidencial**: quem fala com o Keycloak é o servidor do Bonsai; fluxo padrão com PKCE `S256`, sem "direct access grants") |
| Endereços permitidos | retorno do login `http://localhost:3000/api/v1/auth/callback`; retorno após sair `http://localhost:3000/login`; origem `http://localhost:3000` |
| Senha | mínimo 12 caracteres, 1 maiúscula, 1 minúscula, 1 dígito, 1 especial, diferente do usuário e do e-mail |
| Autenticador (TOTP) | **obrigatório em todo login**: o fluxo `bonsai browser` (ligado como *Browser flow*) tem o bloco "Conditional OTP" como *Required* e a condição "user configured" desativada; quem ainda não tem autenticador é levado a cadastrar um. **Configure OTP** também é ação padrão de usuário novo |
| Troca de senha | obrigatória no primeiro acesso (**Update Password** padrão) |
| Bloqueio | temporário após 5 falhas (espera de 1 a 15 min) |
| Sessão | 30 min parada, 10 h no máximo (padrão do Keycloak) |

`bonsai-realm.json` é a referência (não tem o fluxo de login nem o segredo do cliente) dessa configuração (sem usuários nem segredos). Ele não é importado automaticamente: o painel não aceitou a importação por colagem, então a configuração foi feita pelas telas.

## Tema Bonsai na tela de login

O login do Keycloak (e-mail, senha, código do autenticador, troca de senha, erros) usa o tema **bonsai**: logo vertical, frase da marca, cores e fontes de `frontend/BRAND.md`, em claro e escuro, com os textos em português. Ele só vale onde for ligado (reino `bonsai`); os outros reinos do mesmo Keycloak não mudam. Feito para o Keycloak 26 (testado na 26.4).

Fonte do tema: `infrastructure/keycloak/theme/src/`. Se a marca mudar, atualize `resources/css/bonsai.css` (os valores vêm do `tokens.css`) e gere o arquivo de novo.

### Gerar os arquivos

```bash
sh infrastructure/keycloak/theme/build-coolify.sh   # 4 arquivos de texto, para colar no Coolify
sh infrastructure/keycloak/theme/build.sh           # 1 arquivo .jar, para quem tem acesso ao servidor (SSH) ou a um Dockerfile
```

Saem em `infrastructure/keycloak/theme/dist/` (não vão para o git).

### Instalar no Coolify (uma vez) — 4 arquivos de texto

O "File Mount" do Coolify só aceita texto colado (não aceita o `.jar`). Por isso existem os 4 arquivos de `dist/coolify/`:

1. No Coolify, abra o serviço do **Keycloak** → **Storages** → **Add** → **File Mount**. Crie 4, um para cada arquivo: em *Content* cole o conteúdo do arquivo e em *Destination Path* ponha:

   | Arquivo | Destination Path |
   | --- | --- |
   | `theme.properties` | `/opt/keycloak/themes/bonsai/login/theme.properties` |
   | `messages_pt_BR.properties` | `/opt/keycloak/themes/bonsai/login/messages/messages_pt_BR.properties` |
   | `bonsai.css` | `/opt/keycloak/themes/bonsai/login/resources/css/bonsai.css` |
   | `bonsai-logo.svg` | `/opt/keycloak/themes/bonsai/login/resources/img/bonsai-logo.svg` |

2. **Redeploy** o Keycloak (o tema é lido na inicialização).
3. No painel do Keycloak: reino **bonsai** → **Realm settings** → **Themes** → **Login theme** = `bonsai` → **Save**.
4. Em **Realm settings** → **Localization**: ligue *Internationalization*, deixe só **Português (Brasil)** e como padrão.
5. Abra o Bonsai, clique para entrar e confira a página.

Alternativa para quem tem acesso ao servidor ou controla a imagem do Keycloak: copiar `bonsai-keycloak-theme.jar` para `/opt/keycloak/providers/` (com `kc.sh build` se usar `start --optimized`).

### Voltar atrás

Realm settings → Themes → Login theme = (vazio/padrão) → Save. O login volta ao visual antigo na hora e ninguém deixa de conseguir entrar. O arquivo pode ficar instalado sem efeito.

### Ver e testar na sua máquina (sem tocar no servidor da empresa)

```bash
docker compose -f infrastructure/keycloak/test/docker-compose.yml up -d
```

Abra o endereço do Bonsai no Keycloak de teste, `http://localhost:8081/realms/bonsai/account`. A pasta do tema é lida direto: edite o CSS e recarregue a página. Para desligar: `docker compose -f infrastructure/keycloak/test/docker-compose.yml down`. Esse Keycloak não tem usuários nem guarda nada (é descartável).

## Segredos (nunca no git)

No `.env` da raiz: `KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET` (painel: Clients → bonsai-web → Credentials → Client secret), `SESSION_ENCRYPTION_KEY` (`openssl rand -base64 32`) e `APP_BASE_URL`. Depois de editar o `.env`, rode `docker compose up -d` para a API reler.

## Logout em todos os lugares (back-channel)

O código da API já aceita `POST /api/v1/auth/backchannel-logout`, mas o Keycloak é remoto e não alcança `localhost`. Por isso, no ambiente local, o campo *Backchannel logout URL* do cliente fica vazio; a API confere com o Keycloak a cada 5 minutos e derruba a sessão de conta desativada. Quando houver endereço público, preencher com `https://<endereço>/api/v1/auth/backchannel-logout`.

## Ainda falta

- Colocar o `KEYCLOAK_CLIENT_SECRET` no `.env` (feito pela pessoa).
- Criar o primeiro **administrador** (e uma **líder** de teste): Users → Add user, com o papel certo, senha temporária e e-mail. Quem criar a conta deve ser uma pessoa, não o agente.
- Cliente de serviço para a API gerenciar convites (etapa do administrador), com o segredo apenas no `.env`.
- Endereços de produção em `bonsai-web` quando houver.
- Servidor de e-mail (SMTP) para convites e recuperação por e-mail; por enquanto o convite é por link copiado.
