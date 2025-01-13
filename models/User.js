import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      required: true,
    },
    goalWeight: {
      type: Number,
      required: true,
    },
    dailyCalories: Number,
    dailyProteins: Number,
    dailyFats: Number,
    dailyCarbs: Number,
    aiRecommendation: String,
    userStatus: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    premiumExpiresAt: Date,
    language: {
      type: String,
      enum: ["uz", "ru", "en"],
      default: "uz",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
