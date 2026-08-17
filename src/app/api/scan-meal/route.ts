import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * POST /api/scan-meal
 *
 * Receives a base64 meal photo, sends it to Gemini Vision for food
 * identification and macro estimation, then returns structured JSON.
 */

const SYSTEM_PROMPT = `You are a precision nutrition analyst for a fitness coaching app called "Bodied by Esh."

You are analyzing a PHOTOGRAPH of a real meal. Your job is to identify ONLY what you can clearly see.

## STRICT RULES — FOLLOW EXACTLY:

1. **ONLY identify food items you can CLEARLY SEE in the image.** Do NOT guess, infer, or assume hidden ingredients.
2. **If you cannot clearly identify a food item, use a BROAD category** (e.g., "mixed salad" instead of guessing specific greens, "sauce" instead of guessing the type).
3. **Never fabricate or hallucinate items.** If you see 3 items on a plate, list exactly 3 items — not 5.
4. **Portion sizes must be conservative.** Use the plate, bowl, hand, or utensils as size references. A standard dinner plate is ~10 inches (25cm). When uncertain, estimate LOW.
5. **Use USDA FoodData Central standard values** for macros per 100g, then scale to your estimated portion size.
6. **If the image is blurry, dark, or not food**, respond with the error format. Do NOT make up a meal.
7. **Confidence scoring:**
   - 0.9+ = clearly visible, easily identified (e.g., whole chicken breast, banana, rice)
   - 0.7-0.89 = mostly visible but portion uncertain (e.g., pasta with sauce)
   - 0.5-0.69 = partially obscured or uncertain identification
   - Below 0.5 = do NOT include the item at all
8. **Condiments and sauces**: Only include if clearly visible. Do NOT assume dressing on a salad unless you can see it.
9. **Round all macros to 1 decimal place.**

## RESPONSE FORMAT — valid JSON only, no other text:

If meal detected:
{
  "success": true,
  "mealDescription": "Brief 1-sentence description of what you see",
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
}

If NOT a meal or unanalyzable:
{
  "success": false,
  "error": "Brief reason why"
}`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      return Response.json(
        { success: false, error: "Gemini API key not configured. Add GEMINI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { imageBase64, mimeType = "image/jpeg" } = body;

    if (!imageBase64) {
      return Response.json(
        { success: false, error: "Missing imageBase64 field" },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        temperature: 0.1, // Very low temperature for factual accuracy
        topP: 0.8,
      },
    });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: "Analyze this meal photo. Remember: ONLY identify food you can CLEARLY SEE. Do not guess or make up items." },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Parse the JSON from Gemini's response
    // Gemini sometimes wraps in ```json ... ```, so we strip that
    const cleanJson = text
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    return Response.json(parsed);
  } catch (err) {
    console.error("Meal scan error:", err);
    return Response.json(
      { success: false, error: "Failed to analyze meal image. Please try again." },
      { status: 500 }
    );
  }
}
