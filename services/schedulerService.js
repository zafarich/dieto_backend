import cron from "node-cron";
import DailyStats from "../models/DailyStats.js";
import User from "../models/User.js";
import {calculateMealSplits} from "../utils/nutritionCalculator.js";

// Har kuni yarim tunda ishga tushadigan scheduler
export const startDailyStatsScheduler = () => {
  // '0 0 * * *' = har kuni soat 00:00 da
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        console.log("Kunlik statistika scheduleri ishga tushdi:", new Date());

        // Barcha foydalanuvchilarni olish
        const users = await User.find({});

        // Yangi kun sanasi
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

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