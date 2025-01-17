import Product from "../models/Product.js";
import User from "../models/User.js";
import DailyStats from "../models/DailyStats.js";
import Meal from "../models/Meal.js";
import {
  processImageWithOpenAI,
  processNameWithOpenAI,
} from "../utils/aiService.js";

/**
 * Mahsulotni yuklash (rasm yoki nom orqali)
 */
export const uploadProduct = async (req, res) => {
  try {
    const telegramId = req.headers["telegram-user-id"];
    const user = await User.findOne({telegramId});
    const {name, userNotes} = req.body;
    const image = req.file;

    // Foydalanuvchi tilini olish
    const userLanguage = user.language || "uz";

    let aiResponse;
    const notes = userNotes ? JSON.parse(userNotes) : [];

    if (image) {
      aiResponse = await processImageWithOpenAI(image.buffer, notes);
    } else if (name) {
      aiResponse = await processNameWithOpenAI(name, userLanguage, notes);
    } else {
      return res.status(400).json({
        success: false,
        message: "Mahsulot nomi yoki rasm talab qilinadi",
      });
    }

    // Vaqtinchalik ma'lumotlarni res.locals da saqlash
    if (!req.session) {
      req.session = {};
    }

    req.session.tempProduct = {
      aiResponse,
      originalImage: image ? image.buffer : null,
      originalName: name || null,
      userNotes: notes,
    };

    res.status(200).json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    console.error("Mahsulot yuklashda xatolik:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Qayta tahlil qilish
 */
export const retryAnalysis = async (req, res) => {
  try {
    const telegramId = req.headers["telegram-user-id"];
    const user = await User.findOne({telegramId});
    const {newNotes} = req.body;
    const tempProduct = req.session.tempProduct;

    if (!tempProduct) {
      return res.status(400).json({
        success: false,
        message: "Avval mahsulot yuklang",
      });
    }

    const allNotes = [...(tempProduct.userNotes || []), ...newNotes];

    let aiResponse;
    if (tempProduct.originalImage) {
      aiResponse = await processImageWithOpenAI(
        tempProduct.originalImage,
        allNotes,
        tempProduct.aiResponse
      );
    } else {
      aiResponse = await processNameWithOpenAI(
        tempProduct.originalName,
        user.language,
        allNotes
      );
    }

    req.session.tempProduct = {
      ...tempProduct,
      aiResponse,
      userNotes: allNotes,
    };

    res.status(200).json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    console.error("Qayta tahlil qilishda xatolik:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Mahsulotni tasdiqlash va bazaga qo'shish
 */
export const confirmProduct = async (req, res) => {
  try {
    const telegramId = req.headers["telegram-user-id"];
    const user = await User.findOne({telegramId});
    const {mealType, consumptionDate} = req.body;
    const tempProduct = req.session.tempProduct;

    if (!tempProduct || !tempProduct.aiResponse) {
      return res.status(400).json({
        success: false,
        message: "Mahsulot ma'lumotlari topilmadi",
      });
    }

    const {aiResponse} = tempProduct;

    // Yangi mahsulot yaratish
    const newProduct = new Product({
      name: {
        uz: aiResponse.nameUz,
        ru: aiResponse.nameRu,
      },
      measureType: aiResponse.measureType,
      description: {
        uz: aiResponse.descriptionUz || "",
        ru: aiResponse.descriptionRu || "",
      },
      calories: aiResponse.calories,
      proteins: aiResponse.proteins,
      fats: aiResponse.fats,
      carbs: aiResponse.carbs,
      weight: aiResponse.weight,
      imageUrl: tempProduct.originalImage ? "path/to/saved/image" : "",
    });

    await newProduct.save();

    // Agar ovqat turi va sana ko'rsatilgan bo'lsa, Meal yaratish
    if (mealType && consumptionDate) {
      const meal = new Meal({
        userId: user._id,
        date: new Date(consumptionDate),
        type: mealType,
        productId: newProduct._id,
        weight: aiResponse.weight,
      });

      await meal.save();

      // DailyStats ni yangilash
      await updateDailyStats(user._id, meal, aiResponse);
    }

    delete req.session.tempProduct;

    res.status(201).json({
      success: true,
      data: {
        product: newProduct,
        meal: meal || null,
      },
    });
  } catch (error) {
    console.error("Mahsulotni tasdiqlashda xatolik:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Kunlik statistikani yangilash
 */
async function updateDailyStats(userId, meal, productData) {
  const date = new Date(meal.date);
  date.setHours(0, 0, 0, 0);

  let dailyStats = await DailyStats.findOne({userId, date});

  if (!dailyStats) {
    // Yangi kunlik statistika yaratish
    dailyStats = new DailyStats({
      userId,
      date,
      goals: calculateDailyGoals(userId),
      consumed: {
        total: {calories: 0, proteins: 0, fats: 0, carbs: 0},
        breakfast: {calories: 0, proteins: 0, fats: 0, carbs: 0},
        lunch: {calories: 0, proteins: 0, fats: 0, carbs: 0},
        dinner: {calories: 0, proteins: 0, fats: 0, carbs: 0},
        snack: {calories: 0, proteins: 0, fats: 0, carbs: 0},
      },
    });
  }

  // Iste'mol qilingan ovqat statistikasini qo'shish
  const weightRatio = meal.weight / productData.weight;
  const consumed = dailyStats.consumed[meal.type];
  consumed.calories += productData.calories * weightRatio;
  consumed.proteins += productData.proteins * weightRatio;
  consumed.fats += productData.fats * weightRatio;
  consumed.carbs += productData.carbs * weightRatio;

  // Umumiy statistikani yangilash
  const total = dailyStats.consumed.total;
  total.calories += productData.calories * weightRatio;
  total.proteins += productData.proteins * weightRatio;
  total.fats += productData.fats * weightRatio;
  total.carbs += productData.carbs * weightRatio;

  await dailyStats.save();
}

/**
 * Foydalanuvchining mahsulotlarini olish
 */
export const getUserProducts = async (req, res) => {
  try {
    const userId = req.user._id;
    const {date, type} = req.query;

    const query = {userId};
    if (date) query.date = new Date(date);
    if (type) query.type = type;

    const meals = await Meal.find(query).populate("productId").sort({date: -1});

    res.status(200).json({
      success: true,
      data: meals,
    });
  } catch (error) {
    console.error("Mahsulotlarni olishda xatolik:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
