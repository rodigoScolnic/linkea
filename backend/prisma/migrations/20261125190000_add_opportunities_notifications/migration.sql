-- Opportunities, applications and in-app notifications
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'REVIEWING', 'SELECTED', 'REJECTED');
CREATE TYPE "NotificationType" AS ENUM ('NEW_OPPORTUNITY', 'NEW_APPLICATION', 'APPLICATION_UPDATE', 'PROFESSIONAL_INVITATION', 'INVITATION_RESPONSE');

CREATE TABLE "Opportunity" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "title" VARCHAR(140) NOT NULL,
  "description" VARCHAR(3000) NOT NULL,
  "type" VARCHAR(40) NOT NULL,
  "vocalRegisters" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "requirements" VARCHAR(2000),
  "city" TEXT,
  "country" TEXT,
  "deadline" TIMESTAMP(3),
  "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Application" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "talentId" TEXT NOT NULL,
  "message" VARCHAR(2000),
  "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "actorId" TEXT,
  "type" "NotificationType" NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "link" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Opportunity_status_deadline_createdAt_idx" ON "Opportunity"("status", "deadline", "createdAt");
CREATE INDEX "Opportunity_institutionId_createdAt_idx" ON "Opportunity"("institutionId", "createdAt");
CREATE UNIQUE INDEX "Application_opportunityId_talentId_key" ON "Application"("opportunityId", "talentId");
CREATE INDEX "Application_talentId_createdAt_idx" ON "Application"("talentId", "createdAt");
CREATE INDEX "Application_opportunityId_status_createdAt_idx" ON "Application"("opportunityId", "status", "createdAt");
CREATE INDEX "Notification_recipientId_readAt_createdAt_idx" ON "Notification"("recipientId", "readAt", "createdAt");

ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
