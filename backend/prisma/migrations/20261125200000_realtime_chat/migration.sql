-- Realtime chat: read state and message notifications
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_MESSAGE';

ALTER TABLE "Message"
ADD COLUMN "readAt" TIMESTAMP(3);

-- Treat messages sent before read receipts existed as already read.
UPDATE "Message" SET "readAt" = "createdAt";

CREATE INDEX "Message_conversationId_senderId_readAt_idx"
ON "Message"("conversationId", "senderId", "readAt");
