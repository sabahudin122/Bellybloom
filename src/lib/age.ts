export type StageBoundary = {
  minAgeMonthsInclusive: number;
  maxAgeMonthsExclusive: number | null;
};

export type AgeSnapshot = {
  completedDays: number;
  completedMonths: number;
  years: number;
  remainingMonths: number;
  label: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDateOnly(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calculateAge(dateOfBirth: Date, asOf = new Date()): AgeSnapshot {
  const birthDay = utcDateOnly(dateOfBirth);
  const asOfDay = utcDateOnly(asOf);

  if (birthDay > asOfDay) {
    throw new Error("Date of birth cannot be in the future.");
  }

  let completedMonths =
    (asOf.getUTCFullYear() - dateOfBirth.getUTCFullYear()) * 12 +
    (asOf.getUTCMonth() - dateOfBirth.getUTCMonth());

  if (asOf.getUTCDate() < dateOfBirth.getUTCDate()) {
    completedMonths -= 1;
  }

  const years = Math.floor(completedMonths / 12);
  const remainingMonths = completedMonths % 12;
  const parts: string[] = [];

  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (remainingMonths > 0 || years === 0) {
    parts.push(`${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`);
  }

  return {
    completedDays: Math.floor((asOfDay - birthDay) / DAY_MS),
    completedMonths,
    years,
    remainingMonths,
    label: parts.join(" "),
  };
}

export function isAgeInStage(completedMonths: number, stage: StageBoundary) {
  return (
    completedMonths >= stage.minAgeMonthsInclusive &&
    (stage.maxAgeMonthsExclusive === null ||
      completedMonths < stage.maxAgeMonthsExclusive)
  );
}

export function getStageForAge<T extends StageBoundary>(
  completedMonths: number,
  stages: T[],
) {
  return stages.find((stage) => isAgeInStage(completedMonths, stage)) ?? null;
}

export function validateStageSequence(stages: StageBoundary[]) {
  const sorted = [...stages].sort((first, second) => first.minAgeMonthsInclusive - second.minAgeMonthsInclusive);
  if (sorted.length === 0) return { valid: false, error: "At least one age stage is required." };
  if (sorted[0].minAgeMonthsInclusive !== 0) return { valid: false, error: "Age stages must begin at 0 completed months." };
  for (let index = 0; index < sorted.length; index += 1) {
    const stage = sorted[index];
    if (stage.minAgeMonthsInclusive < 0) return { valid: false, error: "Age boundaries cannot be negative." };
    if (stage.maxAgeMonthsExclusive !== null && stage.maxAgeMonthsExclusive <= stage.minAgeMonthsInclusive) {
      return { valid: false, error: "Every exclusive upper boundary must be greater than its inclusive lower boundary." };
    }
    const next = sorted[index + 1];
    if (next && stage.maxAgeMonthsExclusive !== next.minAgeMonthsInclusive) {
      return { valid: false, error: "Age stages must be contiguous and non-overlapping." };
    }
    if (!next && stage.maxAgeMonthsExclusive !== null) {
      return { valid: false, error: "The final age stage must have no upper boundary." };
    }
  }
  return { valid: true, error: null };
}

export function suggestedFeedingStage(completedMonths: number) {
  if (completedMonths < 6) return "BREAST_OR_FORMULA_ONLY";
  if (completedMonths < 8) return "STARTING_SOLIDS";
  if (completedMonths < 12) return "EXPLORING_TEXTURES";
  return "FAMILY_FOODS";
}
