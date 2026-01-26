import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import cors from "cors";

connectDB();

const PORT = process.env.PORT || 5000;
app.use(cors({
  origin: "http://localhost:5173"
}));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
