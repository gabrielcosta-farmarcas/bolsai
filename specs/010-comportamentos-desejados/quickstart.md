# Como validar

1. `docker compose up -d --build --wait` (aplica a migration sozinho).
2. Cadastrar uma pessoa preenchendo "Comportamentos desejados"; reabrir o responsograma e ver o texto.
3. Editar só os comportamentos: aparece a versão 2 com o texto novo e a versão 1 mantém o antigo; a evolução das responsabilidades não muda.
4. Passar de 3.000 caracteres: aviso de quanto passou, sem salvar.
5. Analisar um encontro: a IA cita um comportamento só com trecho que o sustente; pessoa sem comportamentos é analisada como antes.
6. Testes: `npm test` no backend e no frontend.
