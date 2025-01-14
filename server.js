import express from "express";
import cors from "cors";
import config from "./config/config.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import dailyStatsRoutes from "./routes/dailyStatsRoutes.js";
import {startDailyStatsScheduler} from "./services/schedulerService.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Database ulanish
connectDB();

// Schedulerni ishga tushirish
startDailyStatsScheduler();

// Routes
app.use("/api", userRoutes);
app.use("/api/daily-stats", dailyStatsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Serverda xatolik yuz berdi",
  });
});

app.listen(config.port, () => {
  console.log(`Server ${config.port}-portda ishga tushdi`);
});
