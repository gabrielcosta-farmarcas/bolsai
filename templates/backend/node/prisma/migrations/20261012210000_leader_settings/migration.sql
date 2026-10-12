-- Configurações de IA por líder: chave de API (cifrada), modelo e prompt personalizado.
-- PK UUIDv7 gerada pela aplicação, sem default no banco.
CREATE TABLE "leader_settings" (
    "id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "api_key_enc" TEXT,
    "api_key_last4" TEXT,
    "api_key_updated_at" TIMESTAMPTZ(3),
    "model" TEXT,
    "analysis_prompt" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leader_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "leader_settings_leader_id_key" ON "leader_settings"("leader_id");

ALTER TABLE "leader_settings" ADD CONSTRAINT "leader_settings_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
