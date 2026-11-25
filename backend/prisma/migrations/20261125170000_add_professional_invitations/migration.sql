-- Professional invitations and institution-to-talent conversations
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

CREATE TABLE "ProfessionalInvitation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfessionalInvitation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Conversation" ALTER COLUMN "matchId" DROP NOT NULL;
ALTER TABLE "Conversation" ADD COLUMN "invitationId" TEXT;

CREATE UNIQUE INDEX "Conversation_invitationId_key" ON "Conversation"("invitationId");
CREATE INDEX "ProfessionalInvitation_institutionId_createdAt_idx" ON "ProfessionalInvitation"("institutionId", "createdAt");
CREATE INDEX "ProfessionalInvitation_talentId_status_createdAt_idx" ON "ProfessionalInvitation"("talentId", "status", "createdAt");

ALTER TABLE "ProfessionalInvitation" ADD CONSTRAINT "ProfessionalInvitation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfessionalInvitation" ADD CONSTRAINT "ProfessionalInvitation_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ProfessionalInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
