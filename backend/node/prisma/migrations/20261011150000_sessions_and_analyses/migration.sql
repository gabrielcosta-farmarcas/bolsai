-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('draft', 'analysed', 'reviewed');

-- CreateEnum
CREATE TYPE "analysis_status" AS ENUM ('processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "direct_report_id" UUID NOT NULL,
    "held_on" DATE NOT NULL,
    "transcript" TEXT NOT NULL,
    "status" "session_status" NOT NULL DEFAULT 'draft',
    "summary_exported_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "model" TEXT,
    "status" "analysis_status" NOT NULL DEFAULT 'processing',
    "error_message" TEXT,
    "map_version_used" INTEGER,
    "raw_json" JSONB,
    "reviewed_json" JSONB,
    "reviewed_at" TIMESTAMPTZ(3),
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_direct_report_id_held_on_idx" ON "sessions"("direct_report_id", "held_on");

-- CreateIndex
CREATE INDEX "analyses_session_id_created_at_idx" ON "analyses"("session_id", "created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_direct_report_id_fkey" FOREIGN KEY ("direct_report_id") REFERENCES "direct_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- No máximo uma análise final (revisada) por sessão. Índice parcial escrito à mão:
-- o Prisma não declara índice parcial no schema.
CREATE UNIQUE INDEX "analyses_one_final_per_session_uidx" ON "analyses"("session_id") WHERE "reviewed_at" IS NOT NULL;
