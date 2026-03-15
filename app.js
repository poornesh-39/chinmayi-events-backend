import express from "express";
import cors from "cors";

import contactRoutes from "./routes/contact.routes.js";
import experienceRoutes from "./routes/experience.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";

const app = express();

// CORS configuration - allow both local dev and deployed frontend
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://chinmayi-events-frontend.netlify.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use("/api/contact", contactRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/quotation", quotationRoutes);
app.use("/api/gallery", galleryRoutes);

app.get("/", (req, res) => {
  res.send("API running successfully 🚀");
});

export default app;
