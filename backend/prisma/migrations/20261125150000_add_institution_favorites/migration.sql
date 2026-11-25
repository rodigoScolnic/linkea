-- CreateTable
CREATE TABLE "InstitutionFavorite" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionFavorite_institutionId_talentId_key" ON "InstitutionFavorite"("institutionId", "talentId");

-- CreateIndex
CREATE INDEX "InstitutionFavorite_talentId_idx" ON "InstitutionFavorite"("talentId");

-- AddForeignKey
ALTER TABLE "InstitutionFavorite" ADD CONSTRAINT "InstitutionFavorite_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionFavorite" ADD CONSTRAINT "InstitutionFavorite_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
