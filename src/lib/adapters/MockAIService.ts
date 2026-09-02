import type {
  IAIService,
  MealScanResult,
  MenuScanResult,
  RecommendRecipeResult,
  RecipeMacros,
  RecipeResult,
} from "@/lib/ports/IAIService";

export class MockAIService implements IAIService {
  async scanMeal(_imageBase64: string, _mimeType?: string): Promise<MealScanResult> {
    return {
      success: true,
      mealDescription: "Grilled Chicken Breast with Steamed Broccoli and Brown Rice",
      items: [
        {
          name: "Grilled Chicken Breast",
          grams: 150,
          calories: 247.5,
          protein: 46.5,
          carbs: 0.0,
          fat: 5.3,
          confidence: 0.95,
        },
        {
          name: "Steamed Broccoli",
          grams: 100,
          calories: 34.0,
          protein: 2.8,
          carbs: 6.6,
          fat: 0.4,
          confidence: 0.92,
        },
        {
          name: "Brown Rice",
          grams: 120,
          calories: 133.0,
          protein: 3.0,
          carbs: 28.0,
          fat: 1.0,
          confidence: 0.88,
        },
      ],
    };
  }

  async scanMenu(
    _imageBase64: string,
    _mimeType?: string,
    _remainingBudget?: RecipeMacros
  ): Promise<MenuScanResult> {
    return {
      success: true,
      restaurant: "Coastal Grill & Greens",
      items: [
        {
          name: "Grilled Salmon with Asparagus",
          category: "best_choice",
          calories: 460,
          protein: 44,
          carbs: 8,
          fat: 26,
          swap: null,
        },
        {
          name: "Crispy Calamari Basket",
          category: "avoid",
          calories: 840,
          protein: 22,
          carbs: 65,
          fat: 52,
          swap: "Swap fried calamari for grilled shrimp skewers to save 400 calories and 35g fat.",
        },
      ],
    };
  }

  async recommendRecipe(
    remainingMacros?: Partial<RecipeMacros>,
    _pantryIngredients?: string,
    dietaryPreference?: string
  ): Promise<RecommendRecipeResult> {
    const calories = remainingMacros?.calories ?? 420;
    const protein = remainingMacros?.protein ?? 38;
    const carbs = remainingMacros?.carbs ?? 32;
    const fat = remainingMacros?.fat ?? 12;

    const data: RecipeResult = {
      recipeName: dietaryPreference ? `Mock ${dietaryPreference} High-Protein Bowl` : "Mock Coach Esh Fuel Bowl",
      prepTime: "10 mins",
      ingredients: ["150g Lean Turkey Breast", "1/2 cup Quinoa", "1 cup Spinach", "1 tsp Olive Oil"],
      instructions: ["Cook protein", "Steam greens", "Assemble bowl", "Season with herbs and sea salt"],
      macros: { calories, protein, carbs, fat },
      matchingAnalysis: "Mock analysis: perfectly hits target macronutrient goals.",
    };

    return {
      success: true,
      data,
      isFallback: false,
    };
  }
}
