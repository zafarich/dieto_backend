import cron from "node-cron";
import DailyStats from "../models/DailyStats.js";
import User from "../models/User.js";
import {calculateMealSplits} from "../utils/nutritionCalculator.js";

// Har kuni yarim tunda ishga tushadigan scheduler
export const startDailyStatsScheduler = () => {
  // '*/10 * * * * *' = har 10 soniyada
  cron.schedule(
    "*/10 * * * * *",
    async () => {
      try {
        console.log("Test scheduler ishga tushdi:", new Date());

        // Barcha foydalanuvchilarni olish
        const users = await User.find({});

        // Toshkent vaqt zonasida yangi kun sanasi
        const today = new Date();
        today.setHours(0, 0, 0, 0); // UTC emas, mahalliy vaqtni ishlatamiz

        // Kechagi sana
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        for (const user of users) {
          try {
            // Kechagi kunning statistikasini olish
            const yesterdayStats = await DailyStats.findOne({
              userId: user._id,
              date: yesterday,
            });
            console.log("yesterdayStats", yesterdayStats);

            // Yangi kun uchun statistika yaratish
            const newDailyStats = new DailyStats({
              userId: user._id,
              date: today,
              goals: yesterdayStats
                ? yesterdayStats.goals
                : await calculateMealSplits(user),
              consumed: {
                total: {calories: 0, proteins: 0, fats: 0, carbs: 0},
                breakfast: {calories: 0, proteins: 0, fats: 0, carbs: 0},
                lunch: {calories: 0, proteins: 0, fats: 0, carbs: 0},
                dinner: {calories: 0, proteins: 0, fats: 0, carbs: 0},
                snack: {calories: 0, proteins: 0, fats: 0, carbs: 0},
              },
            });

            await newDailyStats.save();
            console.log(`${user._id} uchun yangi kun statistikasi yaratildi`);
          } catch (userError) {
            console.error(`${user._id} uchun xatolik:`, userError);
            continue; // Keyingi foydalanuvchiga o'tish
          }
        }
      } catch (error) {
        console.error("Scheduler xatosi:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Tashkent", // O'zbekiston vaqt zonasi
    }
  );
};
