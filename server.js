import dotenv from "dotenv";
dotenv.config();

console.log("✓ Environment loaded");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✓ Present" : "✗ Missing");

import cors from "cors";
import app from "./app.js";
import connectDB from "./config/db.js";

connectDB();

const PORT = process.env.PORT || 5000;
app.use(cors({
  origin: "http://localhost:5173"
}));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
