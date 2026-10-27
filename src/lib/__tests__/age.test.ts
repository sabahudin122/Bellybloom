import { describe, expect, it } from "vitest";
import { calculateAge, getStageForAge, isAgeInStage, validateStageSequence } from "@/lib/age";

const stages = [
  { slug: "under-6", minAgeMonthsInclusive: 0, maxAgeMonthsExclusive: 6 },
  { slug: "6-8", minAgeMonthsInclusive: 6, maxAgeMonthsExclusive: 8 },
  { slug: "8-10", minAgeMonthsInclusive: 8, maxAgeMonthsExclusive: 10 },
  { slug: "10-12", minAgeMonthsInclusive: 10, maxAgeMonthsExclusive: 12 },
  { slug: "12-24", minAgeMonthsInclusive: 12, maxAgeMonthsExclusive: 24 },
  { slug: "24-plus", minAgeMonthsInclusive: 24, maxAgeMonthsExclusive: null },
];

describe("age-stage boundaries", () => {
  it.each([
    [0, "under-6"],
    [5, "under-6"],
    [6, "6-8"],
    [7, "6-8"],
    [8, "8-10"],
    [10, "10-12"],
    [12, "12-24"],
    [23, "12-24"],
    [24, "24-plus"],
  ])("maps %i completed months to %s", (months, slug) => {
    expect(getStageForAge(months, stages)?.slug).toBe(slug);
  });

  it("uses inclusive lower and exclusive upper boundaries", () => {
    expect(isAgeInStage(6, stages[0])).toBe(false);
    expect(isAgeInStage(6, stages[1])).toBe(true);
  });

  it("calculates only completed months", () => {
    const age = calculateAge(
      new Date("2025-01-15T00:00:00.000Z"),
      new Date("2025-07-14T23:59:59.000Z"),
    );
    expect(age.completedMonths).toBe(5);
    expect(age.completedDays).toBe(180);
  });
});

describe("stage sequence validation", () => {
  it("accepts contiguous inclusive/exclusive boundaries", () => {
    expect(validateStageSequence([{ minAgeMonthsInclusive: 0, maxAgeMonthsExclusive: 6 }, { minAgeMonthsInclusive: 6, maxAgeMonthsExclusive: null }]).valid).toBe(true);
  });

  it("rejects overlaps and gaps", () => {
    expect(validateStageSequence([{ minAgeMonthsInclusive: 0, maxAgeMonthsExclusive: 8 }, { minAgeMonthsInclusive: 6, maxAgeMonthsExclusive: null }]).valid).toBe(false);
    expect(validateStageSequence([{ minAgeMonthsInclusive: 0, maxAgeMonthsExclusive: 5 }, { minAgeMonthsInclusive: 6, maxAgeMonthsExclusive: null }]).valid).toBe(false);
  });
});
