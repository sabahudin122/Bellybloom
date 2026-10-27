import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const ingredients = (items: Array<[string, string]>) =>
  JSON.stringify(items.map(([name, amount]) => ({ name, amount })));

async function main() {
  const nhsSource = await prisma.safetySource.upsert({
    where: {
      organization_version: {
        organization: "NHS",
        version: "accessed-2026-10-17",
      },
    },
    update: {},
    create: {
      title: "NHS weaning and feeding guidance",
      organization: "NHS",
      sourceUrl: "https://www.nhs.uk/baby/weaning-and-feeding/babys-first-solid-foods/",
      version: "accessed-2026-10-17",
      reviewDate: new Date("2026-10-17T00:00:00.000Z"),
      reviewerName: "NHS clinical editorial source (administrator curated)",
      reviewerNotes:
        "Administrator-curated from the linked NHS first-solid-foods and foods-to-avoid pages. Local clinician review remains required before production use.",
    },
  });

  const cdcSource = await prisma.safetySource.upsert({
    where: {
      organization_version: {
        organization: "CDC",
        version: "reviewed-2026-03-11",
      },
    },
    update: {},
    create: {
      title: "CDC Infant and Toddler Nutrition: Choking Hazards",
      organization: "CDC",
      sourceUrl:
        "https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html",
      version: "reviewed-2026-03-11",
      reviewDate: new Date("2026-03-11T00:00:00.000Z"),
      reviewerName: "CDC subject-matter experts",
      reviewerNotes:
        "The source states it was reviewed by subject-matter experts on March 11, 2026. Local clinician review remains required before production use.",
    },
  });

  const stages = [
    {
      slug: "under-6-months",
      title: "Under 6 completed months",
      minAgeMonthsInclusive: 0,
      maxAgeMonthsExclusive: 6,
      summary:
        "Bellybloom does not create solid-food menus for this stage. The approved source keeps breast milk or first infant formula as the feeding focus until around 6 months.",
      foods: "No solid-food catalogue is recommended by Bellybloom for this stage.",
      avoid: "Do not use Bellybloom meal plans to start solids early.",
      textures: "Not applicable for solid-food planning.",
      mealsPerDay: "No solid-food meal schedule.",
      warnings:
        "Premature babies and babies with feeding concerns need individual timing advice from their pediatrician or qualified health professional.",
      sortOrder: 0,
    },
    {
      slug: "6-to-8-months",
      title: "6 to under 8 months",
      minAgeMonthsInclusive: 6,
      maxAgeMonthsExclusive: 8,
      summary:
        "From around 6 months, small amounts of solid food can be offered alongside breast milk or first infant formula when the baby is developmentally ready.",
      foods:
        "Soft cooked vegetables and fruit, potatoes, beans, lentils, meat, fish without bones, and other foods prepared to a safe texture.",
      avoid:
        "Honey, added salt or sugar, whole nuts, hard raw fruit or vegetables, uncut round foods, and cow's milk as a main drink.",
      textures:
        "Smooth, mashed, lumpy, or soft finger foods as the baby can safely manage.",
      mealsPerDay:
        "Start with small amounts. Babies do not need three solid meals a day when first starting.",
      warnings:
        "Seat the baby upright, supervise continuously, and prepare food for the baby's development.",
      sortOrder: 1,
    },
    {
      slug: "8-to-10-months",
      title: "8 to under 10 months",
      minAgeMonthsInclusive: 8,
      maxAgeMonthsExclusive: 10,
      summary:
        "Continue increasing variety while breast milk or first infant formula remains the main drink during the first year.",
      foods:
        "A varied mix of vegetables, fruit, starchy foods, beans, pulses, meat, fish, eggs, and pasteurised full-fat dairy where suitable.",
      avoid:
        "Honey, added salt or sugar, whole nuts, hard or sticky foods, uncut grapes or tomatoes, and known allergens.",
      textures: "Mashed, lumpy, and soft finger foods that break up easily.",
      mealsPerDay: "Gradually move toward three meals; appetite and milk feeds still vary.",
      warnings:
        "Keep the baby upright and supervised. Cut round foods into safe shapes and remove bones, stones, and hard pieces.",
      sortOrder: 2,
    },
    {
      slug: "10-to-12-months",
      title: "10 to under 12 months",
      minAgeMonthsInclusive: 10,
      maxAgeMonthsExclusive: 12,
      summary:
        "Offer a broad range of tastes and textures while continuing usual milk feeds.",
      foods:
        "Three varied meals using vegetables, fruit, starchy foods, beans, pulses, meat, fish, eggs, and suitable dairy.",
      avoid:
        "Honey, added salt or sugar, whole nuts, hard or sticky foods, uncut round foods, and known allergens.",
      textures: "Chopped, mashed, lumpy, and soft finger foods the baby can manage.",
      mealsPerDay: "Three meals alongside usual milk feeds.",
      warnings:
        "Continue close supervision and developmentally appropriate preparation for every meal.",
      sortOrder: 3,
    },
    {
      slug: "12-to-24-months",
      title: "12 to under 24 months",
      minAgeMonthsInclusive: 12,
      maxAgeMonthsExclusive: 24,
      summary:
        "A child can share varied family foods in smaller portions, prepared without unnecessary added salt or sugar.",
      foods:
        "Three varied family meals with starchy foods, fruit and vegetables, dairy or alternatives, and animal or plant proteins.",
      avoid:
        "Whole nuts and other choking hazards, added sugar or sweeteners, hard round foods, and known allergens.",
      textures: "Soft family-food textures, safely cut and matched to chewing skills.",
      mealsPerDay: "Three meals and up to two healthy snacks if needed.",
      warnings:
        "Choking hazards remain relevant even for confident self-feeders. Continue seated, supervised meals.",
      sortOrder: 4,
    },
    {
      slug: "24-months-plus",
      title: "24 months and older",
      minAgeMonthsInclusive: 24,
      maxAgeMonthsExclusive: null,
      summary:
        "Continue varied family meals while following age-appropriate preparation and choking-safety guidance.",
      foods: "Balanced family foods in child-sized portions.",
      avoid:
        "Whole nuts before age 5, hard or sticky choking hazards, excess sugar or salt, and known allergens.",
      textures: "Family textures prepared for the child's chewing and swallowing ability.",
      mealsPerDay: "Regular family meals and age-appropriate snacks.",
      warnings:
        "Choking hazards can persist after a child self-feeds. Keep meals seated, calm, and supervised.",
      sortOrder: 5,
    },
  ];

  for (const stage of stages) {
    await prisma.ageStage.upsert({
      where: { slug: stage.slug },
      update: { ...stage, sourceId: nhsSource.id },
      create: { ...stage, sourceId: nhsSource.id },
    });
  }

  const rules = [
    {
      sourceId: nhsSource.id,
      code: "NO_HONEY_UNDER_12",
      title: "No honey before 12 months",
      description: "Honey is blocked for babies under 12 completed months.",
      kind: "AGE_FORBIDDEN",
      termsJson: JSON.stringify(["honey"]),
      minAgeMonthsInclusive: 0,
      maxAgeMonthsExclusive: 12,
    },
    {
      sourceId: nhsSource.id,
      code: "NO_COW_MILK_MAIN_DRINK_UNDER_12",
      title: "No cow's milk as a main drink before 12 months",
      description: "Cow's milk can be used in cooking from around 6 months but is not a main drink before 12 months.",
      kind: "AGE_FORBIDDEN",
      termsJson: JSON.stringify(["cow's milk as a drink", "cow milk drink", "glass of cow's milk"]),
      minAgeMonthsInclusive: 0,
      maxAgeMonthsExclusive: 12,
    },
    {
      sourceId: nhsSource.id,
      code: "NO_ADDED_SALT_UNDER_24",
      title: "No added salt in baby recipes",
      description: "Added salt, stock cubes, and gravy are blocked in baby meal plans.",
      kind: "AGE_FORBIDDEN",
      termsJson: JSON.stringify(["added salt", "stock cube", "gravy granules"]),
      minAgeMonthsInclusive: 0,
      maxAgeMonthsExclusive: 24,
    },
    {
      sourceId: nhsSource.id,
      code: "NO_ADDED_SUGAR_UNDER_48",
      title: "No added sugar or sweeteners under 4 years",
      description: "Added sugar and sweeteners are blocked for children under 4 years.",
      kind: "AGE_FORBIDDEN",
      termsJson: JSON.stringify(["added sugar", "syrup", "sweetener"]),
      minAgeMonthsInclusive: 0,
      maxAgeMonthsExclusive: 48,
    },
    {
      sourceId: nhsSource.id,
      code: "NO_WHOLE_NUTS_UNDER_60",
      title: "Whole nuts are a choking hazard under 5 years",
      description: "Whole nuts and whole peanuts are blocked before age 5.",
      kind: "CHOKING",
      termsJson: JSON.stringify(["whole nuts", "whole peanut", "chopped nuts"]),
      minAgeMonthsInclusive: 0,
      maxAgeMonthsExclusive: 60,
    },
    {
      sourceId: nhsSource.id,
      code: "NO_RICE_DRINK_UNDER_60",
      title: "No rice drinks under 5 years",
      description: "Rice drinks are blocked as a milk substitute for children under 5.",
      kind: "AGE_FORBIDDEN",
      termsJson: JSON.stringify(["rice drink", "rice milk"]),
      minAgeMonthsInclusive: 0,
      maxAgeMonthsExclusive: 60,
    },
    {
      sourceId: cdcSource.id,
      code: "CHOKING_HAZARDS_UNDER_60",
      title: "Hard, round, sticky, or difficult-to-chew foods",
      description: "Known preparation-specific choking hazards are blocked for young children.",
      kind: "CHOKING",
      termsJson: JSON.stringify([
        "uncut grape",
        "whole grape",
        "whole cherry tomato",
        "raw carrot chunk",
        "raw apple chunk",
        "whole corn kernel",
        "spoonful of nut butter",
        "hot dog",
        "popcorn",
        "hard candy",
        "marshmallow",
      ]),
      minAgeMonthsInclusive: 0,
      maxAgeMonthsExclusive: 60,
    },
  ];

  for (const rule of rules) {
    await prisma.safetyRule.upsert({
      where: { code: rule.code },
      update: {
        ...rule,
        rulesetVersion: "2026.03-cdc-nhs-v1",
        reviewDate: rule.sourceId === cdcSource.id ? cdcSource.reviewDate : nhsSource.reviewDate,
        reviewerNotes:
          rule.sourceId === cdcSource.id ? cdcSource.reviewerNotes : nhsSource.reviewerNotes,
      },
      create: {
        ...rule,
        rulesetVersion: "2026.03-cdc-nhs-v1",
        reviewDate: rule.sourceId === cdcSource.id ? cdcSource.reviewDate : nhsSource.reviewDate,
        reviewerNotes:
          rule.sourceId === cdcSource.id ? cdcSource.reviewerNotes : nhsSource.reviewerNotes,
      },
    });
  }

  const recipes = [
    {
      title: "Sweet potato & pear mash",
      slug: "sweet-potato-pear-mash",
      description: "A softly mashed fruit and vegetable bowl.",
      mealType: "BREAKFAST",
      ingredientsJson: ingredients([["sweet potato", "1/2 small"], ["ripe pear", "1/2, peeled"]]),
      instructionsJson: JSON.stringify([
        "Steam the sweet potato and pear until completely soft.",
        "Mash with a fork, adding a little water to reach the baby's current texture.",
        "Cool before serving and check the texture carefully.",
      ]),
      prepMinutes: 18,
      texture: "smooth or soft mashed",
      minAgeMonths: 6,
      allergenTagsJson: "[]",
      whyGood: "Combines two gentle flavours in a texture that is easy to adapt.",
    },
    {
      title: "Carrot & red lentil bowl",
      slug: "carrot-red-lentil-bowl",
      description: "A soft savoury bowl with vegetables and pulses.",
      mealType: "LUNCH",
      ingredientsJson: ingredients([["red lentils", "2 tbsp, rinsed"], ["carrot", "1 small, peeled"], ["water", "180 ml"]]),
      instructionsJson: JSON.stringify([
        "Simmer the lentils and sliced carrot in water until both are very soft.",
        "Blend or mash to the baby's current texture.",
        "Cool before serving.",
      ]),
      prepMinutes: 22,
      texture: "smooth, mashed, or soft lumpy",
      minAgeMonths: 6,
      allergenTagsJson: "[]",
      whyGood: "Offers vegetables and pulses in one simple meal.",
    },
    {
      title: "Broccoli & potato mash",
      slug: "broccoli-potato-mash",
      description: "A simple green vegetable dinner with a soft texture.",
      mealType: "DINNER",
      ingredientsJson: ingredients([["potato", "1 small, peeled"], ["broccoli florets", "3 small"]]),
      instructionsJson: JSON.stringify([
        "Steam or boil the potato and broccoli until completely tender.",
        "Mash thoroughly with a little cooking water.",
        "Cool and check there are no hard pieces before serving.",
      ]),
      prepMinutes: 20,
      texture: "soft mashed",
      minAgeMonths: 6,
      allergenTagsJson: "[]",
      whyGood: "Pairs a familiar starchy food with a green vegetable.",
    },
    {
      title: "Avocado & pear smash",
      slug: "avocado-pear-smash",
      description: "A quick soft snack with no cooking required.",
      mealType: "SNACK",
      ingredientsJson: ingredients([["ripe avocado", "1/4"], ["ripe pear", "1/4, peeled"]]),
      instructionsJson: JSON.stringify([
        "Mash the avocado and pear until soft and even.",
        "Serve immediately in a texture the baby can manage.",
      ]),
      prepMinutes: 5,
      texture: "soft mashed",
      minAgeMonths: 8,
      allergenTagsJson: "[]",
      whyGood: "A simple way to offer two soft foods together.",
    },
    {
      title: "Chicken, courgette & rice",
      slug: "chicken-courgette-rice",
      description: "A tender one-pot family-style meal for older babies.",
      mealType: "DINNER",
      ingredientsJson: ingredients([["chicken breast", "35 g"], ["courgette", "1/4"], ["white rice", "2 tbsp"], ["water", "220 ml"]]),
      instructionsJson: JSON.stringify([
        "Cook the chicken, courgette, and rice until very soft and the chicken is cooked through.",
        "Shred the chicken finely and mash the mixture to a safe texture.",
        "Cool before serving and check carefully for hard pieces.",
      ]),
      prepMinutes: 28,
      texture: "soft lumpy or finely chopped",
      minAgeMonths: 8,
      allergenTagsJson: "[]",
      whyGood: "Combines a starchy food, vegetable, and protein food.",
    },
    {
      title: "Banana yogurt oat bowl",
      slug: "banana-yogurt-oat-bowl",
      description: "Creamy oats with banana and plain pasteurised yogurt.",
      mealType: "BREAKFAST",
      ingredientsJson: ingredients([["rolled oats", "2 tbsp"], ["water", "80 ml"], ["ripe banana", "1/3"], ["plain full-fat pasteurised yogurt", "1 tbsp"]]),
      instructionsJson: JSON.stringify([
        "Cook the oats in water until very soft.",
        "Mash in the banana and let the mixture cool.",
        "Stir in the yogurt before serving.",
      ]),
      prepMinutes: 10,
      texture: "soft porridge",
      minAgeMonths: 6,
      allergenTagsJson: JSON.stringify(["MILK", "WHEAT_GLUTEN"]),
      whyGood: "Offers fruit, grains, and dairy in a soft breakfast.",
    },
    {
      title: "Soft salmon, pea & potato",
      slug: "soft-salmon-pea-potato",
      description: "A carefully checked fish and vegetable mash.",
      mealType: "LUNCH",
      ingredientsJson: ingredients([["salmon fillet", "30 g, skin removed"], ["potato", "1 small"], ["peas", "2 tbsp"]]),
      instructionsJson: JSON.stringify([
        "Cook the salmon through and steam the potato and peas until soft.",
        "Check the salmon carefully and remove every bone.",
        "Flake finely and mash with the vegetables to the baby's texture.",
      ]),
      prepMinutes: 24,
      texture: "soft mashed or finely flaked",
      minAgeMonths: 8,
      allergenTagsJson: JSON.stringify(["FISH"]),
      whyGood: "Combines fish with two familiar vegetables.",
    },
    {
      title: "Tomato chickpea pasta",
      slug: "tomato-chickpea-pasta",
      description: "Very soft pasta with crushed chickpeas and tomato.",
      mealType: "DINNER",
      ingredientsJson: ingredients([["small wheat pasta", "3 tbsp"], ["no-salt-added chickpeas", "2 tbsp"], ["chopped tomato", "3 tbsp"]]),
      instructionsJson: JSON.stringify([
        "Cook the pasta until very soft.",
        "Simmer the tomato and chickpeas, then crush the chickpeas completely.",
        "Combine, chop to a safe size, and cool before serving.",
      ]),
      prepMinutes: 18,
      texture: "very soft, chopped and crushed",
      minAgeMonths: 10,
      allergenTagsJson: JSON.stringify(["WHEAT_GLUTEN"]),
      whyGood: "Offers a family-style mix of grains, pulses, and tomato.",
    },
  ];

  for (const recipe of recipes) {
    await prisma.recipe.upsert({
      where: { slug: recipe.slug },
      update: { ...recipe, sourceId: nhsSource.id },
      create: { ...recipe, sourceId: nhsSource.id },
    });
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@bellybloom.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      name: process.env.ADMIN_NAME ?? "Bellybloom Admin",
      email: adminEmail,
      passwordHash: await hash(adminPassword, 12),
      role: "ADMIN",
    },
  });

  const demoNames = ["Amila", "Lejla", "Mia", "Hana", "Sara"];
  const demoUsers: Array<{ id: string; name: string }> = [];
  for (let index = 0; index < demoNames.length; index += 1) {
    const email = `demo${index + 1}@bellybloom.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: demoNames[index],
        email,
        passwordHash: await hash("Demo1234!", 12),
      },
    });
    demoUsers.push({ id: user.id, name: user.name });

    if (index === 0) {
      const baby = await prisma.baby.findFirst({ where: { userId: user.id, name: "Lana" } });
      if (!baby) {
        await prisma.baby.create({
          data: {
            userId: user.id,
            name: "Lana",
            dateOfBirth: new Date(new Date().setUTCMonth(new Date().getUTCMonth() - 9)),
            allergyStatus: "NO",
            foodsIntroduced: JSON.stringify(["pear", "sweet potato", "broccoli"]),
          },
        });
      }
    }
  }

  const communitySeeds = [
    {
      authorId: demoUsers[0].id,
      title: "What soft finger foods worked well at nine months?",
      body: "We are moving from mash to softer finger foods and I would love to hear which shapes and textures other families found manageable.",
      category: "FEEDING_RECIPES",
      ageStageTag: "8–10 months",
    },
    {
      authorId: demoUsers[1].id,
      title: "Celebrating a tiny spoon milestone",
      body: "Today my little one tried holding a spoon independently. Most of lunch landed on the bib, but the proud smile was worth sharing.",
      category: "MILESTONES",
      ageStageTag: "12–24 months",
    },
    {
      authorId: demoUsers[2].id,
      title: "Ideas for calmer family mealtimes",
      body: "What small routines help your family settle at the table? We are trying shorter meals and fewer distractions this week.",
      category: "GENERAL_CHAT",
      ageStageTag: null,
    },
  ];

  for (let index = 0; index < communitySeeds.length; index += 1) {
    const seed = communitySeeds[index];
    let post = await prisma.post.findFirst({ where: { title: seed.title } });
    if (!post) post = await prisma.post.create({ data: seed });
    const commentCount = await prisma.comment.count({ where: { postId: post.id } });
    if (commentCount === 0) {
      await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: demoUsers[(index + 1) % demoUsers.length].id,
          body: "Thank you for starting this conversation — it is helpful to hear what other families are trying.",
        },
      });
    }
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : "Seed failed");
    await prisma.$disconnect();
    process.exit(1);
  });
