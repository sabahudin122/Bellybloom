import { z } from "zod";
import {
  ALLERGY_STATUSES,
  COMMON_ALLERGENS,
  FEEDING_STAGES,
} from "@/lib/constants";
import { COMMUNITY_CATEGORIES, REPORT_REASONS, communityContentIssue } from "@/lib/community";

const trimmedString = z.string().trim();

export const registerSchema = z
  .object({
    name: trimmedString.min(2, "Please enter your name.").max(80),
    email: trimmedString.email("Enter a valid email address.").toLowerCase(),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(128)
      .regex(/[a-z]/, "Add a lowercase letter.")
      .regex(/[A-Z]/, "Add an uppercase letter.")
      .regex(/[0-9]/, "Add a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: trimmedString.email().toLowerCase(),
  password: z.string().min(1).max(128),
});

export const babySchema = z
  .object({
    name: trimmedString.min(1, "Add a name or nickname.").max(60),
    dateOfBirth: z.coerce.date(),
    allergyStatus: z.enum(ALLERGY_STATUSES),
    allergies: z.array(z.enum(COMMON_ALLERGENS)).max(COMMON_ALLERGENS.length),
    otherAllergies: trimmedString.max(300).optional().default(""),
    feedingStageOverride: z.enum(FEEDING_STAGES).nullable().optional(),
    foodsIntroduced: z.array(trimmedString.min(1).max(60)).max(100).default([]),
    foodsDisliked: z.array(trimmedString.min(1).max(60)).max(100).default([]),
  })
  .refine((data) => data.dateOfBirth <= new Date(), {
    message: "Date of birth cannot be in the future.",
    path: ["dateOfBirth"],
  })
  .refine((data) => data.allergyStatus === "YES" || data.allergies.length === 0, {
    message: "Select allergens only when allergy status is Yes.",
    path: ["allergies"],
  });

export const ingredientSchema = z.object({
  name: trimmedString.min(1).max(120),
  amount: trimmedString.min(1).max(80),
});

export const mealSchema = z.object({
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  title: trimmedString.min(2).max(120),
  description: trimmedString.min(2).max(300),
  ingredients: z.array(ingredientSchema).min(1).max(20),
  instructions: z.array(trimmedString.min(2).max(400)).min(1).max(12),
  prepMinutes: z.number().int().min(1).max(180),
  texture: trimmedString.min(2).max(100),
  allergenTags: z.array(z.enum(COMMON_ALLERGENS)).max(COMMON_ALLERGENS.length),
  whyGood: trimmedString.min(2).max(300),
});

export const mealPlanPayloadSchema = z.object({
  meals: z.array(mealSchema).min(3).max(4),
});

export const foodLogSchema = z.object({
  foodName: trimmedString.min(1, "Enter a food name.").max(120),
  reaction: z.enum(["NONE", "MILD", "REACTION"]),
  notes: trimmedString.max(500).optional().default(""),
  servedAt: z.coerce.date().refine((date) => date <= new Date(), {
    message: "The served date cannot be in the future.",
  }),
});

export const recipeSearchSchema = z.object({
  query: trimmedString.min(2).max(120),
  babyId: z.string().min(1),
});

const communityText = (minimum: number, maximum: number) =>
  trimmedString.min(minimum).max(maximum).refine((value) => !communityContentIssue(value), {
    message: "Please revise language that may be abusive, spammy, or unsafe.",
  });

export const postSchema = z.object({
  title: communityText(5, 120),
  body: communityText(20, 5000),
  category: z.enum(COMMUNITY_CATEGORIES),
  ageStageTag: trimmedString.max(80).optional().default(""),
});

export const commentSchema = z.object({
  body: communityText(2, 2000),
  parentId: z.string().min(1).nullable().optional(),
});

export const reportSchema = z
  .object({
    postId: z.string().min(1).optional(),
    commentId: z.string().min(1).optional(),
    reason: z.enum(REPORT_REASONS),
    details: trimmedString.max(500).optional().default(""),
  })
  .refine((value) => Boolean(value.postId) !== Boolean(value.commentId), {
    message: "Choose one item to report.",
  });

export type Meal = z.infer<typeof mealSchema>;
export type MealPlanPayload = z.infer<typeof mealPlanPayloadSchema>;
