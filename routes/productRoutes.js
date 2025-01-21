import express from "express";
import {auth} from "../middleware/authMiddleware.js";
import {
  uploadProduct,
  confirmProduct,
  retryAnalysis,
  getUserProducts,
  createManualProduct,
  getFavoriteProducts,
  getConsumedProducts,
} from "../controllers/productController.js";
import multer from "multer";
import path from "path";
import {fileURLToPath} from "url";

// __dirname ni olish uchun
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rasm saqlash uchun multer sozlamalari
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/products")); // backend/public/uploads/products papkasi
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {fileSize: 5 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Faqat rasm fayllar qabul qilinadi"));
    }
  },
});

const router = express.Router();

// Mahsulot nomi yoki rasmni yuborish
router.post(
  "/upload",
  auth,
  upload.single("image"), // "image" maydoni orqali rasm qabul qilinadi
  uploadProduct
);

// Qayta tahlil qilish
router.post("/retry", auth, retryAnalysis);

// Tasdiqlangan mahsulotni qo'shish
router.post("/confirm", auth, confirmProduct);

// Qo'lda mahsulot qo'shish
router.post("/manual", auth, createManualProduct);

// Foydalanuvchi mahsulotlarini olish
router.get("/products", auth, getUserProducts);
router.get("/favorites", auth, getFavoriteProducts);
router.get("/consumed", auth, getConsumedProducts);

export default router;
