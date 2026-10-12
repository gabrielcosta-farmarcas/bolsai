#!/bin/sh
# Gera dist/bonsai-keycloak-theme.jar. Um .jar é um zip com a pasta META-INF/keycloak-themes.json:
# não precisa de Java na máquina. Uso: sh infrastructure/keycloak/theme/build.sh
set -eu
cd "$(dirname "$0")"

OUT="dist/bonsai-keycloak-theme.jar"
mkdir -p dist
rm -f "$OUT"

# -X: sem datas/atributos extras da máquina (o arquivo sai igual a cada geração, se nada mudou).
(cd src && zip -X -r "../$OUT" META-INF theme -x '*.DS_Store' >/dev/null)

echo "Gerado: infrastructure/keycloak/theme/$OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"
unzip -l "$OUT" | awk 'NR>3 && $4 != "" {print "  " $4}' | grep -v '/$'
