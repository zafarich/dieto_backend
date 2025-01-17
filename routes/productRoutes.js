import express from "express";
import {auth} from "../middleware/authMiddleware.js";
import {
  uploadProduct,
  confirmProduct,
  retryAnalysis,
  getUserProducts,
} from "../controllers/productController.js";
import multer from "multer";

// Rasm yuklash uchun multer sozlamalari
const storage = multer.memoryStorage();
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

// Foydalanuvchi mahsulotlarini olish
router.get("/products", auth, getUserProducts);

export default router;
