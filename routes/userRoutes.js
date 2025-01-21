import express from "express";
import {
  createUser,
  getUser,
  updateUserField,
  updatePremiumStatus,
} from "../controllers/userController.js";
import {auth} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route - foydalanuvchi yaratish/yangilash
// router.post("/users", createUser);

// Protected routes - auth middleware orqali himoyalangan
router.post("/users/create", auth, createUser);
router.patch("/users/premium", auth, updatePremiumStatus);
router.put("/users/update", auth, updateUserField);
router.get("/user/me", auth, getUser);
export default router;
