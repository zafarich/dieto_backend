import User from "../models/User.js";

// Telegram ID orqali autentifikatsiya
export const auth = async (req, res, next) => {
  try {
    const telegramId = req.headers["telegram-user-id"];

    if (!telegramId) {
      return res.status(401).json({
        success: false,
        message: "Avtorizatsiyadan o'tilmagan",
      });
    }

    // Foydalanuvchini bazadan tekshirish
    const user = await User.findOne({telegramId});
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    // Foydalanuvchi ma'lumotlarini request'ga qo'shish
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Autentifikatsiya xatosi",
    });
  }
};

// Premium foydalanuvchilar uchun middleware
export const premiumAuth = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.userStatus !== "premium") {
      return res.status(403).json({
        success: false,
        message: "Bu funksiya faqat premium foydalanuvchilar uchun",
      });
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Premium tekshiruvi xatosi",
    });
  }
};
