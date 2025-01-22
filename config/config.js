import dotenv from "dotenv";
import multer from "multer";
import path from "path";
dotenv.config();

// Rasmlarni saqlash uchun storage konfiguratsiyasi
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/meals"); // rasmlar saqlanadigan papka
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maksimal hajm
  },
  fileFilter: (req, file, cb) => {
    // Faqat rasm formatlarini qabul qilish
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Faqat rasmlar qabul qilinadi"));
    }
  },
});

export default {
  port: process.env.PORT || 3000,
  siteUrl: process.env.SITE_URL || "https://cdn2.dieto.uz",
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: "30d",
  openaiApiKey: process.env.OPENAI_API_KEY,
};
