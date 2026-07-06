import express from "express";
import cors from "cors";

import contactRoutes from "./routes/contact.routes.js";
import experienceRoutes from "./routes/experience.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";

const app = express();

// CORS configuration - allow local dev, existing frontend, and env-based deployed frontends
const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.SEO_FRONTEND_URL,
  process.env.NEW_FRONTEND_URL
].filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4321",
  "https://chinmayi-events.netlify.app",
  ...configuredOrigins
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname, protocol } = new URL(origin);
    const isHttps = protocol === "https:";

    return (
      isHttps &&
      (hostname.endsWith(".netlify.app") ||
        hostname.endsWith(".pages.dev") ||
        hostname === "chinmayi-events.com" ||
        hostname === "www.chinmayi-events.com" ||
        hostname === "chinmayievents.com" ||
        hostname === "www.chinmayievents.com" ||
        hostname === "chinmayievents.in" ||
        hostname === "www.chinmayievents.in")
    );
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
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


