import mongoose from "mongoose";

const userFavoriteProductsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    usageCount: {
      type: Number,
      default: 1,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index (bir foydalanuvchi - bir mahsulot)
userFavoriteProductsSchema.index({userId: 1, productId: 1}, {unique: true});

export default mongoose.model(
  "UserFavoriteProducts",
  userFavoriteProductsSchema
);
