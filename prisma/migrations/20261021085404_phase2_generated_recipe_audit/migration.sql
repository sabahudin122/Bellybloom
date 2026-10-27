-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "generatedForBabyId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "ingredientsJson" TEXT NOT NULL,
    "instructionsJson" TEXT NOT NULL,
    "prepMinutes" INTEGER NOT NULL,
    "texture" TEXT NOT NULL,
    "minAgeMonths" INTEGER NOT NULL,
    "maxAgeMonthsExclusive" INTEGER,
    "allergenTagsJson" TEXT NOT NULL DEFAULT '[]',
    "whyGood" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL DEFAULT 'ADMIN_REVIEWED',
    "rulesetVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recipe_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SafetySource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recipe_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recipe_generatedForBabyId_fkey" FOREIGN KEY ("generatedForBabyId") REFERENCES "Baby" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Recipe" ("allergenTagsJson", "createdAt", "createdByUserId", "description", "id", "ingredientsJson", "instructionsJson", "maxAgeMonthsExclusive", "mealType", "minAgeMonths", "prepMinutes", "reviewStatus", "slug", "sourceId", "texture", "title", "updatedAt", "whyGood") SELECT "allergenTagsJson", "createdAt", "createdByUserId", "description", "id", "ingredientsJson", "instructionsJson", "maxAgeMonthsExclusive", "mealType", "minAgeMonths", "prepMinutes", "reviewStatus", "slug", "sourceId", "texture", "title", "updatedAt", "whyGood" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");
CREATE INDEX "Recipe_title_idx" ON "Recipe"("title");
CREATE INDEX "Recipe_createdAt_idx" ON "Recipe"("createdAt");
CREATE INDEX "Recipe_createdByUserId_idx" ON "Recipe"("createdByUserId");
CREATE INDEX "Recipe_generatedForBabyId_idx" ON "Recipe"("generatedForBabyId");
CREATE INDEX "Recipe_minAgeMonths_mealType_idx" ON "Recipe"("minAgeMonths", "mealType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
