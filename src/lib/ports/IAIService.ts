export interface ScannedFoodItem {
  name: string;
  grams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: number;
}

export interface MealScanResult {
  success: boolean;
  mealDescription?: string;
  items?: ScannedFoodItem[];
  error?: string;
}

export interface MenuItemAnalysis {
  name: string;
  category: "best_choice" | "acceptable" | "avoid";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  swap: string | null;
}

export interface MenuScanResult {
  success: boolean;
  restaurant?: string;
  items?: MenuItemAnalysis[];
  error?: string;
}

export interface RecipeMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecipeResult {
  recipeName: string;
  prepTime: string;
  ingredients: string[];
  instructions: string[];
  macros: RecipeMacros;
  matchingAnalysis: string;
}

export interface RecommendRecipeResult {
  success: boolean;
  data: RecipeResult;
  isFallback?: boolean;
  error?: string;
}

export interface IAIService {
  scanMeal(imageBase64: string, mimeType?: string): Promise<MealScanResult>;
  scanMenu(
    imageBase64: string,
    mimeType?: string,
    remainingBudget?: RecipeMacros
  ): Promise<MenuScanResult>;
  recommendRecipe(
    remainingMacros?: Partial<RecipeMacros>,
    pantryIngredients?: string,
    dietaryPreference?: string
  ): Promise<RecommendRecipeResult>;
}
