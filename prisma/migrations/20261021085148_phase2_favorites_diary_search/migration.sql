-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorite_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoodLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "babyId" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "reaction" TEXT NOT NULL DEFAULT 'NONE',
    "notes" TEXT,
    "servedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FoodLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "createdByUserId" TEXT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recipe_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SafetySource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recipe_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Recipe" ("allergenTagsJson", "createdAt", "description", "id", "ingredientsJson", "instructionsJson", "maxAgeMonthsExclusive", "mealType", "minAgeMonths", "prepMinutes", "reviewStatus", "slug", "sourceId", "texture", "title", "updatedAt", "whyGood") SELECT "allergenTagsJson", "createdAt", "description", "id", "ingredientsJson", "instructionsJson", "maxAgeMonthsExclusive", "mealType", "minAgeMonths", "prepMinutes", "reviewStatus", "slug", "sourceId", "texture", "title", "updatedAt", "whyGood" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");
CREATE INDEX "Recipe_title_idx" ON "Recipe"("title");
CREATE INDEX "Recipe_createdAt_idx" ON "Recipe"("createdAt");
CREATE INDEX "Recipe_createdByUserId_idx" ON "Recipe"("createdByUserId");
CREATE INDEX "Recipe_minAgeMonths_mealType_idx" ON "Recipe"("minAgeMonths", "mealType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Favorite_recipeId_idx" ON "Favorite"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_recipeId_key" ON "Favorite"("userId", "recipeId");

-- CreateIndex
CREATE INDEX "FoodLog_babyId_servedAt_idx" ON "FoodLog"("babyId", "servedAt");

-- CreateIndex
CREATE INDEX "FoodLog_createdAt_idx" ON "FoodLog"("createdAt");
