import mongoose from "mongoose";

mongoose.Promise = global.Promise;

const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

export const connectDB = async () => {
  try {
    const URL = process.env.MONGODB_URL; // 👈 moved here

    if (!URL) {
      throw new Error("MONGODB_URL is not defined in .env");
    }

    const conn = await mongoose.connect(URL, connectionOptions);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("error", err => {
      console.error("MongoDB Error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB Disconnected");
    });

  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log("MongoDB Disconnected");
};
