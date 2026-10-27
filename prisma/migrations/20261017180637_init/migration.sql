-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Baby" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "allergyStatus" TEXT NOT NULL DEFAULT 'NOT_SURE',
    "otherAllergies" TEXT,
    "feedingStageOverride" TEXT,
    "foodsIntroduced" TEXT NOT NULL DEFAULT '[]',
    "foodsDisliked" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Baby_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BabyAllergy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "babyId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BabyAllergy_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SafetySource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "reviewDate" DATETIME NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerNotes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SafetyRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "termsJson" TEXT NOT NULL,
    "minAgeMonthsInclusive" INTEGER,
    "maxAgeMonthsExclusive" INTEGER,
    "requiredPreparation" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'BLOCK',
    "rulesetVersion" TEXT NOT NULL,
    "reviewDate" DATETIME NOT NULL,
    "reviewerNotes" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "SafetyRule_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SafetySource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgeStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "minAgeMonthsInclusive" INTEGER NOT NULL,
    "maxAgeMonthsExclusive" INTEGER,
    "summary" TEXT NOT NULL,
    "foods" TEXT NOT NULL,
    "avoid" TEXT NOT NULL,
    "textures" TEXT NOT NULL,
    "mealsPerDay" TEXT NOT NULL,
    "warnings" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AgeStage_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SafetySource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
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
    CONSTRAINT "Recipe_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SafetySource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "babyId" TEXT NOT NULL,
    "planDate" DATETIME NOT NULL,
    "mealsJson" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rulesetVersion" TEXT NOT NULL,
    "generationCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealPlan_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeRejection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "babyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "promptSummary" TEXT NOT NULL,
    "candidateJson" TEXT NOT NULL,
    "reasonsJson" TEXT NOT NULL,
    "rulesetVersion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecipeRejection_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateLimitEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Baby_userId_idx" ON "Baby"("userId");

-- CreateIndex
CREATE INDEX "Baby_createdAt_idx" ON "Baby"("createdAt");

-- CreateIndex
CREATE INDEX "BabyAllergy_babyId_idx" ON "BabyAllergy"("babyId");

-- CreateIndex
CREATE UNIQUE INDEX "BabyAllergy_babyId_allergen_key" ON "BabyAllergy"("babyId", "allergen");

-- CreateIndex
CREATE UNIQUE INDEX "SafetySource_organization_version_key" ON "SafetySource"("organization", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyRule_code_key" ON "SafetyRule"("code");

-- CreateIndex
CREATE INDEX "SafetyRule_active_kind_idx" ON "SafetyRule"("active", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "AgeStage_slug_key" ON "AgeStage"("slug");

-- CreateIndex
CREATE INDEX "AgeStage_sortOrder_idx" ON "AgeStage"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");

-- CreateIndex
CREATE INDEX "Recipe_title_idx" ON "Recipe"("title");

-- CreateIndex
CREATE INDEX "Recipe_createdAt_idx" ON "Recipe"("createdAt");

-- CreateIndex
CREATE INDEX "Recipe_minAgeMonths_mealType_idx" ON "Recipe"("minAgeMonths", "mealType");

-- CreateIndex
CREATE INDEX "MealPlan_babyId_idx" ON "MealPlan"("babyId");

-- CreateIndex
CREATE INDEX "MealPlan_createdAt_idx" ON "MealPlan"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_babyId_planDate_key" ON "MealPlan"("babyId", "planDate");

-- CreateIndex
CREATE INDEX "RecipeRejection_babyId_createdAt_idx" ON "RecipeRejection"("babyId", "createdAt");

-- CreateIndex
CREATE INDEX "RecipeRejection_userId_createdAt_idx" ON "RecipeRejection"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitEvent_userId_action_createdAt_idx" ON "RateLimitEvent"("userId", "action", "createdAt");
