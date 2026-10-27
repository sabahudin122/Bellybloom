-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MealPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "babyId" TEXT NOT NULL,
    "planDate" DATETIME NOT NULL,
    "mealsJson" TEXT NOT NULL,
    "servedSlotsJson" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL,
    "rulesetVersion" TEXT NOT NULL,
    "generationCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealPlan_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MealPlan" ("babyId", "createdAt", "generationCount", "id", "mealsJson", "planDate", "rulesetVersion", "source", "updatedAt") SELECT "babyId", "createdAt", "generationCount", "id", "mealsJson", "planDate", "rulesetVersion", "source", "updatedAt" FROM "MealPlan";
DROP TABLE "MealPlan";
ALTER TABLE "new_MealPlan" RENAME TO "MealPlan";
CREATE INDEX "MealPlan_babyId_idx" ON "MealPlan"("babyId");
CREATE INDEX "MealPlan_createdAt_idx" ON "MealPlan"("createdAt");
CREATE UNIQUE INDEX "MealPlan_babyId_planDate_key" ON "MealPlan"("babyId", "planDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
