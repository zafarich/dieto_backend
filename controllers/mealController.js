import Meal from "../models/Meal.js";
import DailyStats from "../models/DailyStats.js";
import User from "../models/User.js";

// Ovqat qo'shish
export const addMeal = async (req, res) => {
  try {
    const {type, name, weight, calories, proteins, fats, carbs} = req.body;

    const telegramId = req.headers["telegram-user-id"];
    const user = await User.findOne({telegramId});
    const userId = user._id;
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    // Ovqatni saqlash
    const meal = await Meal.create({
      userId,
      date,
      type,
      name,
      weight,
      calories,
      proteins,
      fats,
      carbs,
    });

    // DailyStats ni yangilash
    let dailyStats = await DailyStats.findOne({userId, date});

    if (!dailyStats) {
      // Yangi kun uchun statistika yaratish
      const user = await User.findById(userId);
      dailyStats = await DailyStats.create({
        userId,
        date,
        calories: {
          goal: user.dailyCalories,
          consumed: calories,
        },
        nutrients: {
          proteins: {
            goal: user.dailyProteins,
            consumed: proteins,
          },
          fats: {
            goal: user.dailyFats,
            consumed: fats,
          },
          carbs: {
            goal: user.dailyCarbs,
            consumed: carbs,
          },
        },
      });
    } else {
      // Mavjud statistikani yangilash
      dailyStats.calories.consumed += calories;
      dailyStats.nutrients.proteins.consumed += proteins;
      dailyStats.nutrients.fats.consumed += fats;
      dailyStats.nutrients.carbs.consumed += carbs;
      await dailyStats.save();
    }

    res.status(201).json({
      success: true,
      data: meal,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
