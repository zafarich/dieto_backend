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
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    // Qo'shimcha: Mahsulotning o'zgarishiga mos ravishda ovqatning kaloriyalari va boshqa o'lchovlarini yangilash
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Meal", mealSchema);
