import mongoose from "mongoose";

const localizedStringSchema = new mongoose.Schema(
  {
    uz: {type: String, required: true},
    ru: {type: String, required: false}, // Hozircha rus tilida ma'lumot bo'lmasligi mumkin
  },
  {_id: false}
);
const localizedDescriptionSchema = new mongoose.Schema(
  {
    uz: {type: String, required: false},
    ru: {type: String, required: false}, // Hozircha rus tilida ma'lumot bo'lmasligi mumkin
  },
  {_id: false}
);
const productSchema = new mongoose.Schema(
  {
    name: {
      type: localizedStringSchema,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false, // admin tomonidan qo'shilgan mahsulotlar uchun true
    },
    measureType: {
      type: String,
      enum: ["count", "gram", "ml"],
    },
    description: {
      type: localizedDescriptionSchema,
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
      default: "", // Bo'sh string agar rasm bo'lmasa
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index (faqat public mahsulotlar uchun)
productSchema.index(
  {"name.uz": 1, "name.ru": 1, isPublic: 1},
  {
    unique: true,
    partialFilterExpression: {isPublic: true},
  }
);

export default mongoose.model("Product", productSchema);
