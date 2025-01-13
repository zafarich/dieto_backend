import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB ulanish muvaffaqiyatli: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Xatolik: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
