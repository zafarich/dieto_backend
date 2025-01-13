import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    calories: {
      type: Number,
      required: true,
    },
    proteins: {
      type: Number,
      required: true,
    },
    fats: {
      type: Number,
      required: true,
    },
    carbs: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      default: 100, // 100g standart o'lchov
    },
    imageUrl: String,
    category: {
      type: String,
      enum: [
        "protein",
        "carbs",
        "fats",
        "vegetables",
        "fruits",
        "drinks",
        "other",
      ],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
