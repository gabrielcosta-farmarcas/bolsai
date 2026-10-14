-- Comportamentos desejados do cargo (texto livre, opcional). Só adiciona a coluna: as versões antigas ficam sem valor.
ALTER TABLE "responsibility_maps" ADD COLUMN     "behaviors" TEXT;
