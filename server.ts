import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes";
import userRoutes from "./src/routes/user.routes";
import { connectDatabase, disconnectDatabase } from "./src/config/database";
import accountRoutes from "./src/routes/account.routes";
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.get("/", (_req, res) => {
  res.json({ message: "Snap server is running" });
});

//routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/account", accountRoutes);

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

const shutdown = async () => {
  await disconnectDatabase();
  process.exit(0);
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

void startServer();
