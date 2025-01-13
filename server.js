import express from "express";
import cors from "cors";
import config from "./config/config.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Database ulanish
connectDB();

// Routes
app.use("/api", userRoutes);

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
