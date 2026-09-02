"use client";
import React, { useState } from "react";
import { Loader2, Sparkles, ChefHat, Clock, Apple, Beef, Wheat, Droplets, AlertTriangle, Zap, Check, Plus, Utensils } from "lucide-react";

interface MacroBudget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface RecipeData {
  recipeName: string;
  prepTime: string;
  ingredients: string[];
  instructions: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  matchingAnalysis: string;
}

interface RecipeAdvisorProps {
  remainingBudget: MacroBudget;
  onLogRecipeAsMeal?: (recipe: { name: string; grams?: number; calories: number; protein: number; carbs: number; fat: number }) => void | Promise<void>;
}

const PRESET_CHIPS = [
  { id: "High Protein", label: "High Protein", icon: Beef },
  { id: "Low Carb", label: "Low Carb", icon: Wheat },
  { id: "Post-Workout", label: "Post-Workout", icon: Zap },
  { id: "Quick Snack", label: "Quick Snack", icon: Clock },
] as const;

export default function RecipeAdvisor({ remainingBudget, onLogRecipeAsMeal }: RecipeAdvisorProps) {
  const [pantryInput, setPantryInput] = useState("");
  const [selectedPreference, setSelectedPreference] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [error, setError] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [loggingMeal, setLoggingMeal] = useState(false);

  const handleTogglePreference = (id: string) => {
    setSelectedPreference((prev) => (prev === id ? "" : id));
  };

  const handleGenerate = async () => {
    // Check if remaining macros are zero/negative
    if (
      remainingBudget.calories <= 50 &&
      remainingBudget.protein <= 5 &&
      remainingBudget.carbs <= 5 &&
      remainingBudget.fat <= 2
    ) {
      setError("Your remaining macro budget is too low to recommend a full recipe. Target hit for the day!");
      return;
    }

    setLoading(true);
    setRecipe(null);
    setError("");
    setIsLogged(false);

    try {
      const res = await fetch("/api/recommend-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remainingMacros: remainingBudget,
          pantryIngredients: pantryInput,
          dietaryPreference: selectedPreference,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setRecipe(json.data);
      } else {
        setError(json.error || "Failed to generate recipe recommendation. Try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Network error connecting to the AI nutrition server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (!recipe || !onLogRecipeAsMeal || isLogged) return;
    setLoggingMeal(true);
    try {
      await onLogRecipeAsMeal({
        name: recipe.recipeName,
        calories: Math.round(recipe.macros.calories),
        protein: Math.round(recipe.macros.protein),
        carbs: Math.round(recipe.macros.carbs),
        fat: Math.round(recipe.macros.fat),
        grams: 250,
      });
      setIsLogged(true);
    } catch (err) {
      console.error("Failed to log recipe:", err);
    } finally {
      setLoggingMeal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Budget Summary Banner */}
      <div className="p-4 rounded-2xl bg-cyber-slate border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs text-silver-slate uppercase font-semibold">Your Remaining Budget</h4>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="text-xs text-ice-white font-mono flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-accent-lime" />
              {Math.max(0, remainingBudget.calories)} kcal
            </span>
            <span className="text-xs text-accent-lime font-mono flex items-center gap-1.5 bg-accent-lime/5 px-2.5 py-1 rounded-lg">
              <Beef className="w-3.5 h-3.5" />
              {Math.max(0, remainingBudget.protein)}g Protein
            </span>
            <span className="text-xs text-accent-violet font-mono flex items-center gap-1.5 bg-accent-violet/5 px-2.5 py-1 rounded-lg">
              <Wheat className="w-3.5 h-3.5" />
              {Math.max(0, remainingBudget.carbs)}g Carbs
            </span>
            <span className="text-xs text-ice-white font-mono flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              {Math.max(0, remainingBudget.fat)}g Fat
            </span>
          </div>
        </div>
      </div>

      {/* Dietary Preference Preset Chips */}
      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-wider text-silver-slate font-semibold">
          Dietary Preference Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_CHIPS.map((chip) => {
            const Icon = chip.icon;
            const isSelected = selectedPreference === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleTogglePreference(chip.id)}
                className={`touch-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-accent-lime text-cyber-slate border-accent-lime font-bold shadow-md shadow-accent-lime/10"
                    : "bg-white/5 border-white/10 text-silver-slate hover:text-ice-white hover:border-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs Form */}
      <div className="space-y-3">
        <label className="block text-[10px] uppercase tracking-wider text-silver-slate font-semibold">
          Optional: Add ingredients in your pantry/fridge
        </label>
        <input
          type="text"
          value={pantryInput}
          onChange={(e) => setPantryInput(e.target.value)}
          placeholder="e.g., spinach, eggs, oats, avocado..."
          className="w-full bg-white/5 border border-white/10 focus:border-accent-lime/50 rounded-xl px-4 py-3 text-sm text-ice-white placeholder:text-silver-slate/50 focus:outline-none transition-all"
          disabled={loading}
        />
      </div>

      {/* Button Action */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating custom recipe...
          </>
        ) : (
          <>
            <ChefHat className="w-4 h-4" />
            Generate AI Recipe {selectedPreference ? `(${selectedPreference})` : ""}
          </>
        )}
      </button>

      {/* Errors */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recipe Output Result */}
      {recipe && (
        <div className="glass-panel border-white/5 rounded-3xl p-6 md:p-8 space-y-6 animate-fadeIn bg-cyber-slate/30">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-2">
            <div>
              <h3 className="font-display font-bold text-xl text-ice-white">{recipe.recipeName}</h3>
              <p className="text-[10px] text-accent-lime uppercase font-semibold tracking-wider mt-1 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5" />
                AI Curated Nutrition {selectedPreference ? `· ${selectedPreference}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-silver-slate text-xs bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 shrink-0 self-start sm:self-center">
              <Clock className="w-3.5 h-3.5 text-accent-lime" />
              <span>{recipe.prepTime} Prep</span>
            </div>
          </div>

          {/* Analysis */}
          {recipe.matchingAnalysis && (
            <p className="text-xs text-silver-slate italic leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
              &quot;{recipe.matchingAnalysis}&quot;
            </p>
          )}

          {/* Grid: Ingredients & Instructions */}
          <div className="grid md:grid-cols-12 gap-6">
            {/* Ingredients */}
            <div className="md:col-span-5 space-y-3">
              <h4 className="font-display font-bold text-sm text-ice-white flex items-center gap-1.5">
                <Apple className="w-4.5 h-4.5 text-accent-lime" />
                Ingredients
              </h4>
              <ul className="space-y-1.5 text-xs text-silver-slate list-disc pl-4">
                {recipe.ingredients.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="md:col-span-7 space-y-3">
              <h4 className="font-display font-bold text-sm text-ice-white flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5 text-accent-lime" />
                Step-by-Step Instructions
              </h4>
              <ol className="space-y-3 text-xs text-silver-slate list-decimal pl-4">
                {recipe.instructions.map((step, idx) => (
                  <li key={idx} className="leading-relaxed pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Recipe Macros Grid */}
          <div className="border-t border-white/5 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-silver-slate">
                Recipe Nutritional Breakdown
              </h4>
              {onLogRecipeAsMeal && (
                <button
                  type="button"
                  onClick={handleLogMeal}
                  disabled={isLogged || loggingMeal}
                  className={`touch-target inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                    isLogged
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default"
                      : "bg-accent-lime hover:bg-accent-lime/90 text-cyber-slate shadow-accent-lime/10"
                  }`}
                >
                  {loggingMeal ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Logging Meal...
                    </>
                  ) : isLogged ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Logged as Today&apos;s Meal
                    </>
                  ) : (
                    <>
                      <Utensils className="w-3.5 h-3.5" />
                      1-Tap: Log Recipe as Meal
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-cyber-slate rounded-xl border border-white/5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-silver-slate block">Calories</span>
                <span className="font-display font-bold text-base text-ice-white mt-1 block">
                  {recipe.macros.calories} kcal
                </span>
              </div>
              <div className="p-3 bg-cyber-slate rounded-xl border border-white/5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-silver-slate block">Protein</span>
                <span className="font-display font-bold text-base text-accent-lime mt-1 block">
                  {recipe.macros.protein} g
                </span>
              </div>
              <div className="p-3 bg-cyber-slate rounded-xl border border-white/5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-silver-slate block">Carbs</span>
                <span className="font-display font-bold text-base text-accent-violet mt-1 block">
                  {recipe.macros.carbs} g
                </span>
              </div>
              <div className="p-3 bg-cyber-slate rounded-xl border border-white/5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-silver-slate block">Fat</span>
                <span className="font-display font-bold text-base text-ice-white mt-1 block">
                  {recipe.macros.fat} g
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
