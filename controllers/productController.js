import Product from "../models/Product.js";
import User from "../models/User.js";
import DailyStats from "../models/DailyStats.js";
import Meal from "../models/Meal.js";
import {
  processImageWithOpenAI,
  processNameWithOpenAI,
} from "../utils/aiService.js";
import UserFavoriteProducts from "../models/UserFavoriteProducts.js";
import config from "../config/config.js";

// Global o'zgaruvchi yaratamiz
const tempProducts = new Map();

/**
 * Mahsulotni yuklash (rasm yoki nom orqali)
 */
export const uploadProduct = async (req, res) => {
  try {
    const telegramId = req.headers["telegram-user-id"];
    const user = await User.findOne({telegramId});
    const {name, userNote} = req.body;
    const image = req.file;

    // Foydalanuvchi tilini olish

    let aiResponse;
    const notes = userNote ? [userNote] : [];

    if (image) {
      // Rasm fayl yo'li
      const imageUrl = `/public/uploads/products/${image.filename}`;

      console.log("imageUrl", config.siteUrl + imageUrl);

      aiResponse = await processImageWithOpenAI(
        config.siteUrl + imageUrl,
        notes
      );

      tempProducts.set(telegramId, {
        aiResponse,
        originalImage: imageUrl,
        originalName: name || null,
        userNotes: [...existingNotes, ...notes],
      });
    } else if (name) {
      aiResponse = await processNameWithOpenAI(name, notes);
    } else {
      return res.status(400).json({
        success: false,
        message: "Mahsulot nomi yoki rasm talab qilinadi",
      });
    }

    // Vaqtinchalik ma'lumotlarni Map-da saqlash
    const existingProduct = tempProducts.get(telegramId);
    const existingNotes =
      existingProduct && existingProduct?.userNotes
        ? existingProduct?.userNotes
        : [];

    tempProducts.set(telegramId, {
      aiResponse,
      originalImage: image ? image.buffer : null,
      originalName: name || null,
      userNotes: [...existingNotes, ...notes],
    });

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
    const {newNote} = req.body;

    // Map-dan ma'lumotlarni olish
    const tempProduct = tempProducts.get(telegramId);

    if (!tempProduct) {
      return res.status(400).json({
        success: false,
        message: "Avval mahsulot yuklang",
      });
    }

    console.log(tempProduct);
    console.log(newNote);

    const allNotes = [...(tempProduct?.userNotes || []), newNote];
    console.log(allNotes);
    let aiResponse;
    if (tempProduct.originalImage) {
      aiResponse = await processImageWithOpenAI(
        tempProduct.originalImage,
        [newNote],
        tempProduct.aiResponse
      );
    } else {
      aiResponse = await processNameWithOpenAI(
        tempProduct.originalName,
        user.language,
        [newNote]
      );
    }

    // Yangilangan ma'lumotlarni Map-da saqlash
    tempProducts.set(telegramId, {
      ...tempProduct,
      aiResponse,
      userNotes: allNotes,
    });

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

    // Map-dan ma'lumotlarni olish
    const tempProduct = tempProducts.get(telegramId);

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
      description: {
        uz: aiResponse.descriptionUz || "",
        ru: aiResponse.descriptionRu || "",
      },
      calories: aiResponse.calories,
      proteins: aiResponse.proteins,
      fats: aiResponse.fats,
      carbs: aiResponse.carbs,
      weight: aiResponse.weight,
      imageUrl: tempProduct.originalImage || "", // Saqlangan rasm yo'li
      createdBy: user._id,
      isPublic: false,
      aiGenerated: true,
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

      // Favorite mahsulotlarga qo'shish
      await updateFavoriteProducts(user._id, newProduct._id);
    }

    // Muvaffaqiyatli saqlangandan so'ng vaqtinchalik ma'lumotlarni o'chirish
    tempProducts.delete(telegramId);

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
    const telegramId = req.headers["telegram-user-id"];
    const user = await User.findOne({telegramId});
    const userId = user._id;
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

/**
 * Qo'lda mahsulot qo'shish
 */
export const createManualProduct = async (req, res) => {
  try {
    const telegramId = req.headers["telegram-user-id"];
    const user = await User.findOne({telegramId});
    const {
      nameUz,
      nameRu,
      weight,
      measureType,
      calories,
      proteins,
      fats,
      carbs,
      mealType,
      consumptionDate,
    } = req.body;

    const image = req.file;
    const imageUrl = image ? `/public/uploads/products/${image.filename}` : "";

    // Yangi mahsulot yaratish
    const newProduct = new Product({
      name: {
        uz: nameUz,
        ru: nameRu || nameUz,
      },
      createdBy: user._id,
      isPublic: false,
      measureType,
      calories,
      proteins,
      fats,
      carbs,
      weight,
      aiGenerated: false,
      imageUrl: imageUrl,
    });

    await newProduct.save();

    // Agar ovqat turi va sana ko'rsatilgan bo'lsa, Meal yaratish
    if (mealType && consumptionDate) {
      const meal = new Meal({
        userId: user._id,
        date: new Date(consumptionDate),
        type: mealType,
        productId: newProduct._id,
        weight: weight,
      });

      await meal.save();

      // DailyStats ni yangilash
      await updateDailyStats(user._id, meal, newProduct);

      // Favorite mahsulotlarga qo'shish
      await updateFavoriteProducts(user._id, newProduct._id);
    }

    res.status(201).json({
      success: true,
      data: {
        product: newProduct,
        meal: meal || null,
      },
    });
  } catch (error) {
    console.error("Mahsulot qo'shishda xatolik:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Favorite mahsulotlarni yangilash
 */
async function updateFavoriteProducts(userId, productId) {
  try {
    const favorite = await UserFavoriteProducts.findOne({userId, productId});

    if (favorite) {
      favorite.usageCount += 1;
      favorite.lastUsed = new Date();
      await favorite.save();
    } else {
      await UserFavoriteProducts.create({
        userId,
        productId,
        usageCount: 1,
        lastUsed: new Date(),
      });
    }
  } catch (error) {
    console.error("Favorite mahsulotlarni yangilashda xatolik:", error);
  }
}

/**
 * Favorite mahsulotlarni olish
 */
export const getFavoriteProducts = async (req, res) => {
  try {
    const telegramId = req.headers["telegram-user-id"];
    const user = await User.findOne({telegramId});

    const favorites = await UserFavoriteProducts.find({userId: user._id})
      .sort({usageCount: -1, lastUsed: -1})
      .limit(10)
      .populate("productId");

    res.status(200).json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    console.error("Favorite mahsulotlarni olishda xatolik:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Iste'mol qilingan mahsulotlarni olish
 */
export const getConsumedProducts = async (req, res) => {
  try {
    const telegramId = req.headers["telegram-user-id"];
    const user = await User.findOne({telegramId});
    const {date, type, limit = 20} = req.query;

    const query = {userId: user._id};
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = {$gte: startDate, $lte: endDate};
    }
    if (type) query.type = type;

    const meals = await Meal.find(query)
      .populate("productId")
      .sort({date: -1})
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: meals,
    });
  } catch (error) {
    console.error("Iste'mol qilingan mahsulotlarni olishda xatolik:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
