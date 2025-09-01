import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes";

dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api", uploadRoutes);

// health check
app.get("/", (_req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
