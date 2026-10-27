-- Anotações sobre pessoas e plano de ação. Só adiciona tipo e tabelas: nada existente muda.

-- CreateEnum
CREATE TYPE "note_kind" AS ENUM ('agreement_missed', 'attention', 'praise');

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "direct_report_id" UUID NOT NULL,
    "kind" "note_kind" NOT NULL,
    "description" TEXT NOT NULL,
    "noted_at" DATE NOT NULL,
    "resolved_at" TIMESTAMPTZ(3),
    "bring_to_next_session" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_steps" (
    "id" UUID NOT NULL,
    "note_id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "due_date" DATE,
    "owner" "agreement_owner" NOT NULL DEFAULT 'leader',
    "done_at" TIMESTAMPTZ(3),
    "agreement_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "note_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_leader_id_idx" ON "notes"("leader_id");

-- CreateIndex (parcial: só anotações não excluídas)
CREATE INDEX "notes_direct_report_id_noted_at_idx" ON "notes"("direct_report_id", "noted_at" DESC) WHERE "deleted_at" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "note_steps_agreement_id_key" ON "note_steps"("agreement_id");

-- CreateIndex
CREATE INDEX "note_steps_note_id_position_idx" ON "note_steps"("note_id", "position");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_direct_report_id_fkey" FOREIGN KEY ("direct_report_id") REFERENCES "direct_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_steps" ADD CONSTRAINT "note_steps_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_steps" ADD CONSTRAINT "note_steps_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_steps" ADD CONSTRAINT "note_steps_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
