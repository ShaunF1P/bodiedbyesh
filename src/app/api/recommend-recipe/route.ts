import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validateRequestBody } from "@/lib/validation/api-validator";
import { RecommendRecipeSchema } from "@/lib/validation/schemas";
import { container } from "@/lib/container";

export async function POST(request: NextRequest) {
  // ── Rate Limiting (10 requests/minute per IP) ──────────────────────────
  const rateLimit = checkRateLimit(request, "ai");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const validation = await validateRequestBody(request, RecommendRecipeSchema);
  if (!validation.success) {
    return validation.response;
  }

  const { remainingMacros, pantryIngredients = "", dietaryPreference = "" } = validation.data;

  const result = await container.aiService.recommendRecipe(
    remainingMacros,
    pantryIngredients,
    dietaryPreference
  );

  return Response.json(result);
}
