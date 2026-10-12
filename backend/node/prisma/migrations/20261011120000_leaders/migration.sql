-- O Bonsai não usa a tabela de exemplo `users` do esqueleto.
DROP TABLE "users";

-- Líder (MVP 1: um líder fixo). PK UUIDv7 gerada pela aplicação, sem default no banco.
CREATE TABLE "leaders" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leaders_pkey" PRIMARY KEY ("id")
);

-- Linha técnica de bootstrap: o app funciona sem rodar seed.
-- O id é constante e tem o mesmo valor de FIXED_LEADER_ID em src/shared/security/current-user.ts.
INSERT INTO "leaders" ("id", "name", "updated_at")
VALUES ('00000000-0000-7000-8000-000000000001', 'Líder', CURRENT_TIMESTAMP);
