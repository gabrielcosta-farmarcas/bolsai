-- O prompt de análise agora é um só, fixo na aplicação: não há mais versão para guardar por análise.
ALTER TABLE "analyses" DROP COLUMN "prompt_version";
