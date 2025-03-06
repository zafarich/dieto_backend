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
import contactRoutes from "./routes/contactRoutes.js";
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
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Statik fayllar uchun public papkani ko'rsatish
app.use("/public", express.static(path.join(__dirname, "public")));

// Database ulanish
connectDB();

// Schedulerni ishga tushirish
startDailyStatsScheduler();

// Routes
app.get("/", (req, res) => {
  res.send("Server is running");
});
app.use("/api", userRoutes);
app.use("/api/daily-stats", dailyStatsRoutes);
app.use("/api/products", productRoutes);
app.use("/api", contactRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Serverda xatolik yuz berdi",
  });
});

app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log(`Server ${process.env.PORT || 3000}-portda ishga tushdi`);
});
