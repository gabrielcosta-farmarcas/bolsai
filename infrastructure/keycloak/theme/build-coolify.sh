#!/bin/sh
# Gera dist/coolify/: o mesmo tema, só em arquivos de texto (as fontes vão embutidas no CSS), para
# colar em "File Mount" do Coolify, que não aceita arquivo binário (.jar). Uso:
#   sh infrastructure/keycloak/theme/build-coolify.sh
set -eu
cd "$(dirname "$0")"

SRC="src/theme/bonsai/login"
OUT="dist/coolify"
rm -rf "$OUT"
mkdir -p "$OUT"

cp "$SRC/theme.properties" "$OUT/theme.properties"
cp "$SRC/messages/messages_pt_BR.properties" "$OUT/messages_pt_BR.properties"
cp "$SRC/resources/img/bonsai-logo.svg" "$OUT/bonsai-logo.svg"

# CSS com as fontes embutidas (data URI) no lugar dos arquivos .woff2.
python3 - "$SRC/resources/css/bonsai.css" "$SRC/resources/fonts" "$OUT/bonsai.css" <<'PY'
import base64, re, sys
css_path, fonts_dir, out_path = sys.argv[1:4]
css = open(css_path, encoding="utf-8").read()
def inline(match):
    name = match.group(1)
    data = base64.b64encode(open(f"{fonts_dir}/{name}", "rb").read()).decode()
    return f"url('data:font/woff2;base64,{data}')"
css = re.sub(r"url\('\.\./fonts/([^']+)'\)", inline, css)
assert "../fonts/" not in css
open(out_path, "w", encoding="utf-8").write(css)
PY

echo "Gerado em infrastructure/keycloak/theme/$OUT:"
for f in theme.properties messages_pt_BR.properties bonsai.css bonsai-logo.svg; do
  printf '  %-26s %s bytes\n' "$f" "$(wc -c < "$OUT/$f" | tr -d ' ')"
done

# Trecho para colar no Compose do Coolify (Services não deixam criar File Mount pela tela):
# cada arquivo vira um volume "bind" com o conteúdo (`content`), que o Coolify grava no servidor.
python3 - "$OUT" <<'PY'
import sys
out = sys.argv[1]
base = "/opt/keycloak/themes/bonsai/login"
files = [
    ("theme.properties", f"{base}/theme.properties"),
    ("messages_pt_BR.properties", f"{base}/messages/messages_pt_BR.properties"),
    ("bonsai.css", f"{base}/resources/css/bonsai.css"),
    ("bonsai-logo.svg", f"{base}/resources/img/bonsai-logo.svg"),
]
lines = []
for name, target in files:
    lines += [
        "      - type: bind",
        f"        source: ./bonsai-theme/{name}",
        f"        target: {target}",
        "        content: |",
    ]
    for line in open(f"{out}/{name}", encoding="utf-8").read().rstrip("\n").split("\n"):
        lines.append(f"          {line}" if line else "")
open(f"{out}/compose-volumes.yml", "w", encoding="utf-8").write("\n".join(lines) + "\n")
PY
echo "  compose-volumes.yml        $(wc -c < "$OUT/compose-volumes.yml" | tr -d ' ') bytes (trecho para o Compose)"
