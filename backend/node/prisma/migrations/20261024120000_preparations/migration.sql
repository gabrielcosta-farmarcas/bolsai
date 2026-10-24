-- Roteiro para o próximo 1:1, gerado sob demanda. Reaproveita o tipo "analysis_status" (processing, completed, failed).
-- CreateTable
CREATE TABLE "preparations" (
    "id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "direct_report_id" UUID NOT NULL,
    "model" TEXT,
    "status" "analysis_status" NOT NULL DEFAULT 'processing',
    "error_message" TEXT,
    "map_version_used" INTEGER,
    "content" JSONB,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "preparations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "preparations_direct_report_id_created_at_idx" ON "preparations"("direct_report_id", "created_at");

-- AddForeignKey
ALTER TABLE "preparations" ADD CONSTRAINT "preparations_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparations" ADD CONSTRAINT "preparations_direct_report_id_fkey" FOREIGN KEY ("direct_report_id") REFERENCES "direct_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
