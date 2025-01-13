import express from "express";
import {
  createOrUpdateUser,
  getUser,
  updatePremiumStatus,
  calculateDailyGoals,
} from "../controllers/userController.js";
import {auth} from "../middleware/auth.js";

const router = express.Router();

// Public route - foydalanuvchi yaratish/yangilash
router.post("/users", createOrUpdateUser);

// Protected routes - auth middleware orqali himoyalangan
router.get("/users/:telegramId", auth, getUser);
router.patch("/users/:telegramId/premium", auth, updatePremiumStatus);
router.post("/users/:telegramId/calculate-goals", auth, calculateDailyGoals);

export default router;
