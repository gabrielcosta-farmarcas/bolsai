-- Anotações passam a usar Combinados em vez de "passos": o combinado ganha a ligação com a anotação.
-- Os passos que já existem viram combinados antes de a tabela de passos sair (nada se perde).

-- AlterTable
ALTER TABLE "agreements" ADD COLUMN "note_id" UUID;

-- CreateIndex
CREATE INDEX "agreements_note_id_idx" ON "agreements"("note_id");

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Passos que já tinham virado combinado: só ligam o combinado à anotação.
UPDATE "agreements" a
SET "note_id" = s."note_id"
FROM "note_steps" s
WHERE s."agreement_id" = a."id";

-- Passos que ainda eram só rascunho: viram combinados abertos (ou feitos) ligados à anotação.
INSERT INTO "agreements" (
    "id", "leader_id", "direct_report_id", "description", "owner", "due_date",
    "status", "origin", "confirmed_at", "closed_at", "note_id", "created_at", "updated_at"
)
SELECT
    gen_random_uuid(), s."leader_id", n."direct_report_id", s."text", s."owner", s."due_date",
    CASE WHEN s."done_at" IS NULL THEN 'open'::"agreement_status" ELSE 'done'::"agreement_status" END,
    'leader'::"agreement_origin", s."created_at", s."done_at", s."note_id", s."created_at", CURRENT_TIMESTAMP
FROM "note_steps" s
JOIN "notes" n ON n."id" = s."note_id"
WHERE s."agreement_id" IS NULL;

-- DropTable
DROP TABLE "note_steps";
