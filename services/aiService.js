import OpenAI from "openai";
import config from "../config/config.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export const calculateDailyNutrients = (userData) => {
  try {
    // 1. BMR ni hisoblash (Mifflin-St Jeor formulasi)
    const age = calculateAge(userData.birthDate);
    let bmr;

    if (userData.gender === "male") {
      bmr = 10 * userData.weight + 6.25 * userData.height - 5 * age + 5;
    } else {
      bmr = 10 * userData.weight + 6.25 * userData.height - 5 * age - 161;
    }

    // 2. Faollik koeffitsienti
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    // 3. TEE (Total Energy Expenditure) ni hisoblash
    const tee = bmr * activityFactors[userData.activityLevel];
    // 4. Maqsadga qarab kaloriyani sozlash
    const weightDiff = userData.goalWeight - userData.weight;
    const calorieAdjustment = (weightDiff / 0.5) * 800;
    let dailyCalories = Math.round(
      tee + Math.max(-800, Math.min(800, calorieAdjustment))
    );

    // 5. Makronutrientlarni maqsadga qarab hisoblash
    let proteinPercentage, carbPercentage, fatPercentage;

    if (weightDiff > 0) {
      // Vazn to'plash
      proteinPercentage = 0.25; // 25%
      carbPercentage = 0.5; // 50%
      fatPercentage = 0.25; // 25%
    } else {
      // Vazn yo'qotish
      proteinPercentage = 0.35; // 35%
      carbPercentage = 0.35; // 35%
      fatPercentage = 0.3; // 30%
    }

    // Kaloriyalarni grammlarga o'tkazish
    // Protein: 1g = 4 kkal
    // Uglevodlar: 1g = 4 kkal
    // Yog'lar: 1g = 9 kkal
    const dailyProteins = Math.round((dailyCalories * proteinPercentage) / 4);
    const dailyCarbs = Math.round((dailyCalories * carbPercentage) / 4);
    const dailyFats = Math.round((dailyCalories * fatPercentage) / 9);

    return {
      dailyCalories,
      dailyProteins,
      dailyFats,
      dailyCarbs,
    };
  } catch (error) {
    console.error("Hisoblash xatosi:", error);
    throw new Error("Kunlik me'yorlarni hisoblashda xatolik yuz berdi");
  }
};

const calculateAge = (birthDate) => {
  console.log(birthDate);
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};
