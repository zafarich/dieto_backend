import express from "express";
import session from "express-session";
import cors from "cors";
import config from "./config/config.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import dailyStatsRoutes from "./routes/dailyStatsRoutes.js";
import {startDailyStatsScheduler} from "./services/schedulerService.js";
import productRoutes from "./routes/productRoutes.js";

const app = express();

// Session middleware-ni qo'shamiz
app.use(
  session({
    secret: "zafar0000A123qwe!@#", // Muhim: Bu yerga xavfsiz kalit yozing
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS uchun
      maxAge: 60 * 60 * 1000, // 1 soat
    },
  })
);

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
app.use("/api/products", productRoutes);
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
