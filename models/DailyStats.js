import mongoose from "mongoose";

const nutrientsSchema = new mongoose.Schema({
  calories: {type: Number, required: true},
  proteins: {type: Number, required: true},
  fats: {type: Number, required: true},
  carbs: {type: Number, required: true},
});

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
    goals: {
      total: nutrientsSchema,
      mealSplits: {
        breakfast: nutrientsSchema, // 25%
        lunch: nutrientsSchema, // 35%
        dinner: nutrientsSchema, // 30%
        snack: nutrientsSchema, // 10%
      },
    },
    consumed: {
      total: nutrientsSchema,
      breakfast: nutrientsSchema,
      lunch: nutrientsSchema,
      dinner: nutrientsSchema,
      snack: nutrientsSchema,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index (bir foydalanuvchi uchun bir kunda bitta record)
dailyStatsSchema.index({userId: 1, date: 1}, {unique: true});

export default mongoose.model("DailyStats", dailyStatsSchema);
