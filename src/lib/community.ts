export const COMMUNITY_CATEGORIES = [
  "FEEDING_RECIPES",
  "SLEEP",
  "HEALTH",
  "ALLERGIES",
  "MILESTONES",
  "GENERAL_CHAT",
] as const;

export const COMMUNITY_CATEGORY_LABELS: Record<(typeof COMMUNITY_CATEGORIES)[number], string> = {
  FEEDING_RECIPES: "Feeding & Recipes",
  SLEEP: "Sleep",
  HEALTH: "Health",
  ALLERGIES: "Allergies",
  MILESTONES: "Milestones",
  GENERAL_CHAT: "General Chat",
};

export const REPORT_REASONS = ["SPAM", "HARASSMENT", "UNSAFE_ADVICE", "PRIVACY", "OTHER"] as const;

const blockedPatterns = [
  /\b(fuck|shit|bitch)\b/i,
  /buy\s+followers/i,
  /guaranteed\s+cure/i,
  /contact\s+me\s+on\s+whatsapp/i,
  /casino\s+bonus/i,
];

export function communityContentIssue(value: string) {
  const links = value.match(/https?:\/\//gi)?.length ?? 0;
  if (links > 3) return "Please remove excess links.";
  if (/(.)\1{14,}/i.test(value)) return "Please remove repeated characters.";
  if (blockedPatterns.some((pattern) => pattern.test(value))) {
    return "Please revise language that may be abusive, spammy, or unsafe.";
  }
  return null;
}
