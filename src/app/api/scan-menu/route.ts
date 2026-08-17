import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * POST /api/scan-menu
 *
 * Receives a base64 restaurant menu photo + the client's remaining
 * macro budget, sends it to Gemini Vision for menu analysis, and
 * returns scored/ranked menu items.
 */

const SYSTEM_PROMPT = `You are a precision nutrition advisor for a fitness coaching app called "Bodied by Esh."

Given a photograph of a restaurant menu AND the client's remaining daily macro budget, you must:
1. Extract all readable menu items from the image.
2. Estimate macros for each item (calories, protein, carbs, fat) using your knowledge of restaurant portions.
3. Score each item based on how well it fits the remaining macro budget:
   - "best_choice" — fits the budget well, high protein-to-calorie ratio
   - "acceptable" — fits with minor tradeoffs
   - "avoid" — would significantly exceed the budget or is nutritionally poor
4. Provide a specific swap suggestion for any "acceptable" or "avoid" items (e.g., "Get grilled instead of fried, saves ~18g fat").

CRITICAL RULES:
- Restaurant portions are typically 1.5-2x larger than home portions. Factor this in.
- Prioritize protein density for fitness clients.
- If the image is not a menu or is unreadable, respond with the error format.

Respond ONLY with valid JSON in this exact format:
{
  "success": true,
  "restaurant": "Restaurant name if visible, or 'Unknown'",
  "items": [
    {
      "name": "Grilled Salmon",
      "category": "best_choice",
      "calories": 480,
      "protein": 42,
      "carbs": 12,
      "fat": 28,
      "swap": null
    },
    {
      "name": "Fish & Chips",
      "category": "avoid",
      "calories": 920,
      "protein": 28,
      "carbs": 72,
      "fat": 56,
      "swap": "Ask for grilled fish with a side salad instead of fries — saves ~400 kcal and 40g fat"
    }
  ]
}

If the image is not a menu:
{
  "success": false,
  "error": "Brief reason"
}`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      return Response.json(
        { success: false, error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { imageBase64, mimeType = "image/jpeg", remainingBudget } = body;

    if (!imageBase64) {
      return Response.json(
        { success: false, error: "Missing imageBase64 field" },
        { status: 400 }
      );
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const budgetContext = remainingBudget
      ? `\n\nThe client's REMAINING daily macro budget is:
- Calories: ${remainingBudget.calories} kcal
- Protein: ${remainingBudget.protein}g
- Carbs: ${remainingBudget.carbs}g
- Fat: ${remainingBudget.fat}g

Score items based on how well they fit THIS specific budget.`
      : "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT + budgetContext },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    const cleanJson = text
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    return Response.json(parsed);
  } catch (err) {
    console.error("Menu scan error:", err);
    return Response.json(
      { success: false, error: "Failed to analyze menu image. Please try again." },
      { status: 500 }
    );
  }
}
