import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  try {
    console.log("MongoDB ulanish boshlandi...");

    const conn = await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4,
    });

    console.log("MongoDB ga muvaffaqiyatli ulandi");
  } catch (error) {
    console.error("MongoDB ulanish xatosi:", {
      message: error.message,
      code: error.code,
      details: error,
    });
    process.exit(1);
  }
};

export default connectDB;
