-- AlterTable
ALTER TABLE "leaders" ADD COLUMN "keycloak_subject" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "leaders_keycloak_subject_key" ON "leaders"("keycloak_subject");

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "leader_id" UUID,
    "kc_sid" TEXT,
    "roles" TEXT[],
    "email" TEXT,
    "name" TEXT,
    "tokens_enc" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refreshed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_sessions_kc_sid_idx" ON "auth_sessions"("kc_sid");

-- CreateIndex
CREATE INDEX "auth_sessions_subject_idx" ON "auth_sessions"("subject");

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");
