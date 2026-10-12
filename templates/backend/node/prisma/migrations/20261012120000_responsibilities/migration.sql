-- CreateEnum
CREATE TYPE "title_source" AS ENUM ('fallback', 'ai', 'leader');

-- CreateTable
CREATE TABLE "responsibilities" (
    "id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "direct_report_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_source" "title_source" NOT NULL DEFAULT 'fallback',
    "key" TEXT NOT NULL,
    "retired_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "responsibilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "responsibilities_direct_report_id_retired_at_idx" ON "responsibilities"("direct_report_id", "retired_at");

-- CreateIndex
CREATE INDEX "responsibilities_leader_id_idx" ON "responsibilities"("leader_id");

-- CreateIndex
CREATE UNIQUE INDEX "responsibilities_direct_report_id_key_key" ON "responsibilities"("direct_report_id", "key");

-- AddForeignKey
ALTER TABLE "responsibilities" ADD CONSTRAINT "responsibilities_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsibilities" ADD CONSTRAINT "responsibilities_direct_report_id_fkey" FOREIGN KEY ("direct_report_id") REFERENCES "direct_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
