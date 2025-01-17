import mongoose from "mongoose";

const localizedStringSchema = new mongoose.Schema(
  {
    uz: {type: String, required: true},
    ru: {type: String, required: false}, // Hozircha rus tilida ma'lumot bo'lmasligi mumkin
  },
  {_id: false}
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: localizedStringSchema,
      required: true,
      unique: true,
    },
    measureType: {
      type: String,
      enum: ["count", "gram", "ml"],
      required: true,
    },
    description: {
      type: localizedStringSchema,
      required: true,
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
    imageUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index (mahsulot nomi bir xil bo'lmasligi uchun)
productSchema.index({"name.uz": 1, "name.ru": 1}, {unique: true});

export default mongoose.model("Product", productSchema);
