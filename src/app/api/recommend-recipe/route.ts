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
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      return Response.json(
        { success: false, error: "Gemini API key is not configured in Vercel settings." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { remainingMacros, pantryIngredients = "" } = body;

    if (!remainingMacros) {
      return Response.json({ success: false, error: "remainingMacros field is required" }, { status: 400 });
    }

    const { calories = 0, protein = 0, carbs = 0, fat = 0 } = remainingMacros;

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
        temperature: 0.2, // Keep it relatively deterministic to fit macros accurately
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
      // Fallback clean-up in case the model returned backticks
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      jsonResult = JSON.parse(cleaned);
    }

    return Response.json({ success: true, data: jsonResult });
  } catch (err: any) {
    console.error("Recipe recommendation failed:", err);
    return Response.json({ success: false, error: err.message || "Failed to generate recipe recommendation" }, { status: 500 });
  }
}
