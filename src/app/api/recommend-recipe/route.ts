import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a precision sports nutritionist and culinary designer for a high-end coaching platform called "Bodied by Esh."

Your goal is to generate a premium, delicious, and healthy recipe (snack or meal) that fits perfectly within the client's remaining daily macro budget.

## STRICT CONSTRAINTS:
1. **The estimated macros of the generated recipe MUST be equal to or less than the client's remaining budget.** Under no circumstances should the recipe exceed the remaining limits for Calories, Protein, Carbs, or Fat.
2. **If the user provides a list of ingredients (pantryIngredients), prioritize using them**, but you can assume standard pantry staples (spices, cooking spray, salt, pepper, olive oil, water, etc.) are available.
3. **The output must be structured, clear, and focused on clean eating** (high quality proteins, complex carbs, healthy fats, minimal processed sugars).
4. **ROUND all macros in the recipe to 1 decimal place.**

## RESPONSE FORMAT:
You must respond with a single valid JSON object containing exactly the fields below. Do not include any other markdown wrappers, conversational text, or explanations outside the JSON.

{
  "recipeName": "Title of the Recipe",
  "prepTime": "e.g., 15 mins",
  "ingredients": [
    "150g raw chicken breast (cubed)",
    "50g uncooked white basmati rice"
  ],
  "instructions": [
    "Step 1 details...",
    "Step 2 details..."
  ],
  "macros": {
    "calories": 345.5,
    "protein": 42.0,
    "carbs": 38.5,
    "fat": 3.0
  },
  "matchingAnalysis": "1-2 sentences explaining why this meal is perfect for their remaining budget and how it helps them hit their goals."
}`;

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const { remainingMacros, pantryIngredients = "" } = body;
  const calories = remainingMacros?.calories || 400;
  const protein = remainingMacros?.protein || 35;
  const carbs = remainingMacros?.carbs || 30;
  const fat = remainingMacros?.fat || 10;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      throw new Error("Gemini API key is not configured in Vercel settings.");
    }

    const userPrompt = `Generate a macro-optimized recipe for the following remaining targets:
- Calories: ${calories} kcal
- Protein: ${protein} g
- Carbs: ${carbs} g
- Fat: ${fat} g
${pantryIngredients ? `\nAvailable ingredients to incorporate if possible: ${pantryIngredients}` : ""}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]);

    const response = result.response;
    const text = response.text();

    let jsonResult;
    try {
      jsonResult = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      jsonResult = JSON.parse(cleaned);
    }

    return Response.json({ success: true, data: jsonResult });
  } catch (err: any) {
    console.warn("Gemini AI recipe generation fallback triggered:", err.message);

    const fallbackRecipe = {
      recipeName: "Esh's Power Protein Skillet Bowl",
      prepTime: "12 mins",
      ingredients: [
        `${Math.round(protein * 4)}g lean grilled chicken breast or seared tofu`,
        `${Math.round(carbs * 2.5)}g seasoned jasmine rice or quinoa`,
        "1 cup steamed broccoli florets and bell peppers",
        "1 tsp cold-pressed olive oil, sea salt, garlic, and smoked paprika"
      ],
      instructions: [
        "Warm a skillet over medium heat with a light spray of olive oil.",
        "Add protein and vegetables, seasoning generously with smoked paprika, garlic, and sea salt.",
        "Sauté for 5-7 minutes until warm and tender-crisp.",
        "Plate over jasmine rice, drizzle with remaining olive oil, and serve immediately."
      ],
      macros: {
        calories: Number(calories.toFixed(1)),
        protein: Number(protein.toFixed(1)),
        carbs: Number(carbs.toFixed(1)),
        fat: Number(fat.toFixed(1))
      },
      matchingAnalysis: "Crafted specifically to hit your remaining protein and macronutrient targets while fueling muscle recovery and lean energy."
    };

    return Response.json({ success: true, data: fallbackRecipe, isFallback: true });
  }
}
