import express from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import {fileURLToPath} from "url";
import config from "./config/config.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import dailyStatsRoutes from "./routes/dailyStatsRoutes.js";
import {startDailyStatsScheduler} from "./services/schedulerService.js";
import productRoutes from "./routes/productRoutes.js";
import fs from "fs";

const app = express();

// __dirname ni olish uchun
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads papkasini yaratish
const uploadsPath = path.join(__dirname, "public/uploads/products");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, {recursive: true});
}

// Session middleware
app.use(
  session({
    secret: "zafar0000A123qwe!@#",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    },
  })
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Statik fayllar uchun public papkani ko'rsatish
app.use("/public", express.static(path.join(__dirname, "public")));

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
