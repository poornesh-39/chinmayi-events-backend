import mongoose from "mongoose";
import dns from "dns";

// Force reliable DNS resolution (useful on some networks)
dns.setServers([
  "8.8.8.8", // Google DNS
  "1.1.1.1"  // Cloudflare DNS
]);

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(mongoURI);

    console.log("MongoDB connected successfully ✅");
  } catch (error) {
    console.error("MongoDB connection failed ❌:", error.message);
    process.exit(1);
  }
};

export default connectDB;
