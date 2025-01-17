import {calculateDailyNutrients} from "../services/aiService.js";

export const calculateMealSplits = async (user) => {
  try {
    // AI xizmatidan kunlik me'yorlarni olish
    const dailyNorms = await calculateDailyNutrients(user);

    const for_lose_weight = user.goalWeight < user.weight;

    const percent_breakfast = for_lose_weight ? 0.2 : 0.25;
    const percent_lunch = for_lose_weight ? 0.45 : 0.35;
    const percent_dinner = for_lose_weight ? 0.2 : 0.25;
    const percent_snack = 0.15;

    // Ovqatlanish vaqtlarini taqsimlash
    const mealSplits = {
      breakfast: {
        calories: Math.round(dailyNorms.dailyCalories * percent_breakfast), // 30%
        proteins: Math.round(dailyNorms.dailyProteins * percent_breakfast),
        fats: Math.round(dailyNorms.dailyFats * percent_breakfast),
        carbs: Math.round(dailyNorms.dailyCarbs * percent_breakfast),
      },
      lunch: {
        calories: Math.round(dailyNorms.dailyCalories * percent_lunch), // 35%
        proteins: Math.round(dailyNorms.dailyProteins * percent_lunch),
        fats: Math.round(dailyNorms.dailyFats * percent_lunch),
        carbs: Math.round(dailyNorms.dailyCarbs * percent_lunch),
      },
      dinner: {
        calories: Math.round(dailyNorms.dailyCalories * percent_dinner), // 25%
        proteins: Math.round(dailyNorms.dailyProteins * percent_dinner),
        fats: Math.round(dailyNorms.dailyFats * percent_dinner),
        carbs: Math.round(dailyNorms.dailyCarbs * percent_dinner),
      },
      snacks: {
        calories: Math.round(dailyNorms.dailyCalories * percent_snack), // 10%
        proteins: Math.round(dailyNorms.dailyProteins * percent_snack),
        fats: Math.round(dailyNorms.dailyFats * percent_snack),
        carbs: Math.round(dailyNorms.dailyCarbs * percent_snack),
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
