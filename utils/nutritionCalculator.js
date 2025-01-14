import {calculateDailyNutrients} from "../services/aiService.js";

export const calculateMealSplits = async (user) => {
  try {
    // AI xizmatidan kunlik me'yorlarni olish
    const dailyNorms = await calculateDailyNutrients(user);

    // Ovqatlanish vaqtlarini taqsimlash
    const mealSplits = {
      breakfast: {
        calories: Math.round(dailyNorms.dailyCalories * 0.3), // 30%
        proteins: Math.round(dailyNorms.dailyProteins * 0.3),
        fats: Math.round(dailyNorms.dailyFats * 0.3),
        carbs: Math.round(dailyNorms.dailyCarbs * 0.3),
      },
      lunch: {
        calories: Math.round(dailyNorms.dailyCalories * 0.35), // 35%
        proteins: Math.round(dailyNorms.dailyProteins * 0.35),
        fats: Math.round(dailyNorms.dailyFats * 0.35),
        carbs: Math.round(dailyNorms.dailyCarbs * 0.35),
      },
      dinner: {
        calories: Math.round(dailyNorms.dailyCalories * 0.25), // 25%
        proteins: Math.round(dailyNorms.dailyProteins * 0.25),
        fats: Math.round(dailyNorms.dailyFats * 0.25),
        carbs: Math.round(dailyNorms.dailyCarbs * 0.25),
      },
      snacks: {
        calories: Math.round(dailyNorms.dailyCalories * 0.1), // 10%
        proteins: Math.round(dailyNorms.dailyProteins * 0.1),
        fats: Math.round(dailyNorms.dailyFats * 0.1),
        carbs: Math.round(dailyNorms.dailyCarbs * 0.1),
      },
    };

    return {
      total: dailyNorms,
      mealSplits,
    };
  } catch (error) {
    throw new Error(`Kunlik me'yorlarni hisoblashda xatolik: ${error.message}`);
  }
};
