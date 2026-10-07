// Must stay the first import: it populates process.env for every module below.
import "./config/env.js";

console.log("✓ Environment loaded");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✓ Present" : "✗ Missing");
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✓ Present" : "✗ Missing");

import app from "./app.js";
import connectDB from "./config/db.js";
import { bootstrapAdmin, resetAdminPassword } from "./config/bootstrapAdmin.js";

// Without a signing secret every admin route would answer 500, so fail loudly
// at boot rather than at the first request.
if (!process.env.JWT_SECRET) {
  console.error("✗ JWT_SECRET is required. Set it before starting the server.");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await bootstrapAdmin();
  await resetAdminPassword();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
