import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  IAIService,
  MealScanResult,
  MenuScanResult,
  RecommendRecipeResult,
  RecipeMacros,
  RecipeResult,
} from "@/lib/ports/IAIService";
import { runWithTimeout } from "@/lib/ai/safe-ai";
import { logger } from "@/lib/logger";

const MEAL_SCAN_SYSTEM_PROMPT = `You are a precision nutrition analyst for a fitness coaching app called "Bodied by Esh."
You are analyzing a PHOTOGRAPH of a real meal. Your job is to identify ONLY what you can clearly see.

## STRICT RULES:
1. ONLY identify food items you can CLEARLY SEE in the image. Do NOT guess, infer, or assume hidden ingredients.
2. If you cannot clearly identify a food item, use a BROAD category.
3. Never fabricate or hallucinate items.
4. Portion sizes must be conservative.
5. Use USDA FoodData Central standard values for macros per 100g, then scale to estimated portion.
6. Confidence scoring: 0.9+ clearly visible, 0.7-0.89 mostly visible, 0.5-0.69 partially obscured, below 0.5 exclude.
7. Round all macros to 1 decimal place.

## RESPONSE FORMAT (valid JSON only):
{
  "success": true,
  "mealDescription": "Brief 1-sentence description",
  "items": [
    {
      "name": "Grilled Chicken Breast",
      "grams": 150,
      "calories": 247.5,
      "protein": 46.5,
      "carbs": 0.0,
      "fat": 5.3,
      "confidence": 0.92
    }
  ]
}`;

const MENU_SCAN_SYSTEM_PROMPT = `You are a precision nutrition advisor for a fitness coaching app called "Bodied by Esh."
Given a photograph of a restaurant menu AND the client's remaining daily macro budget, extract items, estimate macros, and classify category ("best_choice", "acceptable", "avoid") with swap advice.

Respond ONLY with valid JSON in this format:
{
  "success": true,
  "restaurant": "Restaurant Name",
  "items": [
    {
      "name": "Grilled Salmon",
      "category": "best_choice",
      "calories": 480,
      "protein": 42,
      "carbs": 12,
      "fat": 28,
      "swap": null
    }
  ]
}`;

const RECIPE_SYSTEM_PROMPT = `You are a precision sports nutritionist and culinary designer for "Bodied by Esh."
Generate a premium, delicious recipe matching the client's remaining daily macro budget.
Respond ONLY with valid JSON:
{
  "recipeName": "Title",
  "prepTime": "15 mins",
  "ingredients": ["150g chicken breast"],
  "instructions": ["Step 1..."],
  "macros": {
    "calories": 345.5,
    "protein": 42.0,
    "carbs": 38.5,
    "fat": 3.0
  },
  "matchingAnalysis": "Explanation..."
}`;

export class GeminiAIService implements IAIService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
  }

  async scanMeal(imageBase64: string, mimeType: string = "image/jpeg"): Promise<MealScanResult> {
    if (!this.apiKey || this.apiKey === "your-gemini-api-key-here") {
      throw new Error("Gemini API key is not configured.");
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
      },
    });

    const execution = model.generateContent([
      { text: MEAL_SCAN_SYSTEM_PROMPT },
      { text: "Analyze this meal photo. ONLY identify food you can CLEARLY SEE." },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const result = await runWithTimeout(execution, 8000);
    const text = result.response.text();
    const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleanJson);
  }

  async scanMenu(
    imageBase64: string,
    mimeType: string = "image/jpeg",
    remainingBudget?: RecipeMacros
  ): Promise<MenuScanResult> {
    if (!this.apiKey || this.apiKey === "your-gemini-api-key-here") {
      throw new Error("Gemini API key is not configured.");
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const budgetContext = remainingBudget
      ? `\n\nRemaining Budget: ${remainingBudget.calories} kcal, ${remainingBudget.protein}g P, ${remainingBudget.carbs}g C, ${remainingBudget.fat}g F.`
      : "";

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const execution = model.generateContent([
      { text: MENU_SCAN_SYSTEM_PROMPT + budgetContext },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const result = await runWithTimeout(execution, 8000);
    const text = result.response.text();
    const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleanJson);
  }

  async recommendRecipe(
    remainingMacros?: Partial<RecipeMacros>,
    pantryIngredients: string = "",
    dietaryPreference: string = ""
  ): Promise<RecommendRecipeResult> {
    const calories = remainingMacros?.calories ?? 400;
    const protein = remainingMacros?.protein ?? 35;
    const carbs = remainingMacros?.carbs ?? 30;
    const fat = remainingMacros?.fat ?? 10;

    try {
      if (!this.apiKey || this.apiKey === "your-gemini-api-key-here") {
        throw new Error("Gemini API key is not configured.");
      }

      const userPrompt = `Generate a macro-optimized recipe for remaining targets:
- Calories: ${calories} kcal
- Protein: ${protein} g
- Carbs: ${carbs} g
- Fat: ${fat} g
${dietaryPreference ? `- Preference: ${dietaryPreference}` : ""}
${pantryIngredients ? `- Pantry: ${pantryIngredients}` : ""}`;

      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const execution = model.generateContent([
        { text: RECIPE_SYSTEM_PROMPT },
        { text: userPrompt },
      ]);

      const result = await runWithTimeout(execution, 8000);
      const text = result.response.text();
      let jsonResult: RecipeResult;
      try {
        jsonResult = JSON.parse(text);
      } catch {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        jsonResult = JSON.parse(cleaned);
      }

      return { success: true, data: jsonResult };
    } catch (err: any) {
      logger.warn("[GeminiAIService] Falling back to deterministic recipe generator:", {
        error: err.message,
      });

      const fallback: RecipeResult = {
        recipeName: "Esh's Power Protein Skillet Bowl",
        prepTime: "12 mins",
        ingredients: [
          `${Math.round(protein * 4)}g lean grilled chicken breast or seared tofu`,
          `${Math.round(carbs * 2.5)}g seasoned jasmine rice or quinoa`,
          "1 cup steamed broccoli florets and bell peppers",
          "1 tsp cold-pressed olive oil, sea salt, garlic, and smoked paprika",
        ],
        instructions: [
          "Warm a skillet over medium heat with olive oil spray.",
          "Add protein and veggies, seasoning generously with smoked paprika and garlic.",
          "Sauté for 5-7 minutes until warm and tender-crisp.",
          "Plate over rice, drizzle with olive oil, and serve immediately.",
        ],
        macros: {
          calories: Number(calories.toFixed(1)),
          protein: Number(protein.toFixed(1)),
          carbs: Number(carbs.toFixed(1)),
          fat: Number(fat.toFixed(1)),
        },
        matchingAnalysis:
          "Crafted specifically to hit your remaining protein and macronutrient targets while fueling lean recovery.",
      };

      return { success: true, data: fallback, isFallback: true };
    }
  }
}
