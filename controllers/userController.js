import User from "../models/User.js";
import {calculateDailyNutrients} from "../services/aiService.js";

// Foydalanuvchini yaratish yoki mavjud bo'lsa yangilash
export const createOrUpdateUser = async (req, res) => {
  try {
    const {
      telegramId,
      name,
      gender,
      birthDate,
      weight,
      height,
      activityLevel,
      goalWeight,
      phone,
    } = req.body;

    // Majburiy maydonlarni tekshirish
    const requiredFields = [
      "telegramId",
      "name",
      "gender",
      "birthDate",
      "weight",
      "height",
      "activityLevel",
      "goalWeight",
      "phone",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Quyidagi maydonlar to'ldirilmagan: ${missingFields.join(
          ", "
        )}`,
      });
    }

    // Mavjud foydalanuvchini izlash
    let user = await User.findOne({telegramId});

    if (user) {
      // Foydalanuvchi mavjud bo'lsa yangilash
      user = await User.findOneAndUpdate(
        {telegramId},
        {
          name,
          gender,
          birthDate,
          weight,
          height,
          activityLevel,
          goalWeight,
          userStatus: user.userStatus,
          phone,
        },
        {new: true, runValidators: true}
      );
    } else {
      // Yangi foydalanuvchi yaratish
      user = await User.create({
        telegramId,
        name,
        gender,
        birthDate,
        weight,
        height,
        activityLevel,
        goalWeight,
        userStatus: "free",
        phone,
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Foydalanuvchi ma'lumotlarini olish
export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({telegramId: req.params.telegramId});

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Premium statusni yangilash
export const updatePremiumStatus = async (req, res) => {
  try {
    const {userStatus} = req.body;

    const user = await User.findOneAndUpdate(
      {telegramId: req.params.telegramId},
      {userStatus},
      {new: true}
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Kunlik me'yorlarni hisoblash
export const calculateDailyGoals = async (req, res) => {
  try {
    const {telegramId} = req.params;
    const user = await User.findOne({telegramId});

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    const dailyGoals = await calculateDailyNutrients(user);

    // Foydalanuvchi ma'lumotlarini yangilash
    user.dailyCalories = dailyGoals.dailyCalories;
    user.dailyProteins = dailyGoals.dailyProteins;
    user.dailyFats = dailyGoals.dailyFats;
    user.dailyCarbs = dailyGoals.dailyCarbs;
    // user.aiRecommendation = dailyGoals.recommendation;

    await user.save();

    res.status(200).json({
      success: true,
      data: dailyGoals,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
