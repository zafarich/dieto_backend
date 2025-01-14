import DailyStats from "../models/DailyStats.js";
import {calculateMealSplits} from "../utils/nutritionCalculator.js";

// Kunlik me'yorlarni yangilash
export const updateDailyGoals = async (userId, userData) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // O'tgan kunni tekshirish
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Kechagi kunning statistikasini olish
    const yesterdayStats = await DailyStats.findOne({
      userId: userId,
      date: yesterday,
    });

    let dailyStats = await DailyStats.findOne({
      userId: userId,
      date: today,
    });

    if (!dailyStats) {
      // Yangi kun uchun statistika yaratish
      const mealSplits = yesterdayStats
        ? yesterdayStats.goals // Agar kechagi statistika mavjud bo'lsa, uni ishlatamiz
        : await calculateMealSplits(userData); // Aks holda yangi hisob-kitob

      dailyStats = new DailyStats({
        userId: userId,
        date: today,
        goals: {
          total: {
            calories: mealSplits.total.dailyCalories,
            proteins: mealSplits.total.dailyProteins,
            fats: mealSplits.total.dailyFats,
            carbs: mealSplits.total.dailyCarbs,
          },
          mealSplits: {
            breakfast: mealSplits.mealSplits.breakfast,
            lunch: mealSplits.mealSplits.lunch,
            dinner: mealSplits.mealSplits.dinner,
            snack: mealSplits.mealSplits.snacks,
          },
        },
      });
    } else if (userData.forceUpdate) {
      // Faqat majburiy yangilash bo'lganda (foydalanuvchi ma'lumotlari o'zgartirilganda)
      const mealSplits = await calculateMealSplits(userData);

      dailyStats.goals = {
        total: {
          calories: mealSplits.total.dailyCalories,
          proteins: mealSplits.total.dailyProteins,
          fats: mealSplits.total.dailyFats,
          carbs: mealSplits.total.dailyCarbs,
        },
        mealSplits: {
          breakfast: mealSplits.mealSplits.breakfast,
          lunch: mealSplits.mealSplits.lunch,
          dinner: mealSplits.mealSplits.dinner,
          snack: mealSplits.mealSplits.snacks,
        },
      };
    }

    await dailyStats.save();
    return dailyStats;
  } catch (error) {
    throw new Error(`Kunlik me'yorlarni yangilashda xatolik: ${error.message}`);
  }
};

export const getDailyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const dateStr = req.params.date; // "YYYY-MM-DD" formatida

    // Sanani UTC 00:00 ga o'rnatish
    const date = new Date(dateStr);
    date.setUTCHours(0, 0, 0, 0);

    // Kunlik statistikani bazadan olish
    let dailyStats = await DailyStats.findOne({
      userId: userId,
      date: date,
    });

    console.log(dailyStats);

    // Agar statistika topilmasa, yangi yaratish
    if (!dailyStats) {
      dailyStats = await DailyStats.create({
        userId: userId,
        date: date,
        goals: {
          total: {
            calories: 0,
            proteins: 0,
            fats: 0,
            carbs: 0,
          },
          mealSplits: {
            breakfast: {calories: 0, proteins: 0, fats: 0, carbs: 0},
            lunch: {calories: 0, proteins: 0, fats: 0, carbs: 0},
            dinner: {calories: 0, proteins: 0, fats: 0, carbs: 0},
            snack: {calories: 0, proteins: 0, fats: 0, carbs: 0},
          },
        },
        consumed: {
          total: {calories: 0, proteins: 0, fats: 0, carbs: 0},
          breakfast: {calories: 0, proteins: 0, fats: 0, carbs: 0},
          lunch: {calories: 0, proteins: 0, fats: 0, carbs: 0},
          dinner: {calories: 0, proteins: 0, fats: 0, carbs: 0},
          snack: {calories: 0, proteins: 0, fats: 0, carbs: 0},
        },
      });
    }

    res.status(200).json({
      success: true,
      data: dailyStats,
    });
  } catch (error) {
    console.error("Kunlik statistikani olishda xatolik:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
