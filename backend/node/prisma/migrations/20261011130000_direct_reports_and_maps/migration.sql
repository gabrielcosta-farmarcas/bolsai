-- Collation ICU para ordenar nomes em português (database/DATABASE.md).
CREATE COLLATION IF NOT EXISTS "pt_br" (provider = icu, locale = 'pt-BR', deterministic = true);

-- CreateEnum
CREATE TYPE "direct_report_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "map_file_type" AS ENUM ('pdf', 'docx', 'text');

-- CreateTable
-- PK UUIDv7 gerada pela aplicação. Exclusão lógica só em direct_reports (deleted_at).
CREATE TABLE "direct_reports" (
    "id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "name" TEXT COLLATE "pt_br" NOT NULL,
    "role" TEXT NOT NULL,
    "started_at" DATE NOT NULL,
    "status" "direct_report_status" NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "direct_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsibility_maps" (
    "id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "direct_report_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "file_name" TEXT,
    "file_type" "map_file_type" NOT NULL,
    "text" TEXT NOT NULL,
    "file_bytes" BYTEA,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "responsibility_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "responsibility_maps_direct_report_id_version_key" ON "responsibility_maps"("direct_report_id", "version");

-- Índice parcial: listagem de liderados visíveis (escrito à mão; o Prisma não declara índice parcial).
CREATE INDEX "direct_reports_leader_status_active_idx" ON "direct_reports"("leader_id", "status") WHERE "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "direct_reports" ADD CONSTRAINT "direct_reports_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsibility_maps" ADD CONSTRAINT "responsibility_maps_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsibility_maps" ADD CONSTRAINT "responsibility_maps_direct_report_id_fkey" FOREIGN KEY ("direct_report_id") REFERENCES "direct_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
