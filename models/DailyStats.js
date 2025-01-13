import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dailyStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    calories: {
      goal: Number,
      consumed: Number,
    },
    nutrients: {
      proteins: {
        goal: Number,
        consumed: Number,
      },
      fats: {
        goal: Number,
        consumed: Number,
      },
      carbs: {
        goal: Number,
        consumed: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Unique index yaratish (bir foydalanuvchi uchun bir kunda bitta record)
dailyStatsSchema.index({userId: 1, date: 1}, {unique: true});

export default mongoose.model("DailyStats", dailyStatsSchema);
