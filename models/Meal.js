import mongoose from "mongoose";

const mealSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    calories: Number,
    proteins: Number,
    fats: Number,
    carbs: Number,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Meal", mealSchema);
