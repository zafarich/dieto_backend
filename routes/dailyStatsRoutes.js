import express from "express";
import {auth} from "../middleware/authMiddleware.js";
import {getDailyStats} from "../controllers/dailyStatsController.js";

const router = express.Router();

// Routelar keyinroq qo'shiladi
router.get("/:date", auth, getDailyStats);

export default router;
