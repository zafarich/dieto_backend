import User from "../models/User.js";
import {updateDailyGoals} from "./dailyStatsController.js";
import {calculateDailyNutrients} from "../services/aiService.js";

// Foydalanuvchini yaratish yoki mavjud bo'lsa yangilash
export const createUser = async (req, res) => {
  try {
    const telegramId = req.headers["telegram-user-id"];
    const {
      name,
      gender,
      birthDate,
      weight,
      height,
      activityLevel,
      goalWeight,
      phone,
    } = req.body;

    // Sanani ISO formatga o'tkazish
    const [day, month, year] = birthDate.split(".");
    const formattedBirthDate = new Date(
      year,
      parseInt(month) - 1,
      parseInt(day)
    );

    // Majburiy maydonlarni tekshirish
    const requiredFields = [
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
          birthDate: formattedBirthDate,
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
        name,
        telegramId,
        gender,
        birthDate: formattedBirthDate,
        weight,
        height,
        activityLevel,
        goalWeight,
        userStatus: "free",
        phone,
      });
    }

    // Kunlik me'yorlarni yangilash
    await updateDailyGoals(user._id, {
      ...user.toObject(),
      forceUpdate: true,
    });

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
export const updateUserField = async (req, res) => {
  const telegramId = req.headers["telegram-user-id"];
  const body = req.body;
  const user = await User.findOneAndUpdate(
    {telegramId},
    {$set: body},
    {new: true}
  );

  const fields_for_calculation = [
    "gender",
    "weight",
    "height",
    "birthDate",
    "goalWeight",
    "activityLevel",
  ];

  const checkFields = Object.keys(body).some((key) =>
    fields_for_calculation.includes(key)
  );

  if (checkFields) {
    await updateDailyGoals(user._id, {
      ...user.toObject(),
      forceUpdate: true,
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
};
// Foydalanuvchi ma'lumotlarini olish
export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({
      telegramId: req.headers["telegram-user-id"],
    });

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
