-- CreateEnum
CREATE TYPE "agreement_owner" AS ENUM ('leader', 'report');

-- CreateEnum
CREATE TYPE "agreement_status" AS ENUM ('open', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "agreement_origin" AS ENUM ('ai', 'leader');

-- CreateTable
CREATE TABLE "agreements" (
    "id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "direct_report_id" UUID NOT NULL,
    "origin_session_id" UUID,
    "analysis_id" UUID,
    "description" TEXT NOT NULL,
    "owner" "agreement_owner" NOT NULL,
    "due_date" DATE,
    "status" "agreement_status" NOT NULL DEFAULT 'open',
    "evidence_excerpt" TEXT,
    "origin" "agreement_origin" NOT NULL,
    "confirmed_at" TIMESTAMPTZ(3),
    "closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agreements_direct_report_id_status_idx" ON "agreements"("direct_report_id", "status");

-- CreateIndex
CREATE INDEX "agreements_origin_session_id_idx" ON "agreements"("origin_session_id");

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_direct_report_id_fkey" FOREIGN KEY ("direct_report_id") REFERENCES "direct_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_origin_session_id_fkey" FOREIGN KEY ("origin_session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

