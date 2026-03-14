import express from "express";
import cors from "cors";

import contactRoutes from "./routes/contact.routes.js";
import experienceRoutes from "./routes/experience.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/contact", contactRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/quotation", quotationRoutes);

app.get("/", (req, res) => {
  res.send("API running successfully 🚀");
});

export default app;
