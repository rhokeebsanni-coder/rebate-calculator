// must be before any other require
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.js");
const snapshotRouter = require("./routes/snapshot.js");
const materialsRouter = require("./routes/materials.js");

const notFound = require("./middleware/notFound.js");
const errorHandlerMiddleware = require("./middleware/error-handler.js");
const connectDB = require("./db/connect.js");

const app = express();
const port = 5000;

const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET", // add this
  "GOOGLE_CLIENT_ID",
  "RESEND_API_KEY",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error("❌ Missing environment variables:", missingVars.join(", "));
  process.exit(1);
}

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-app.vercel.app", // replace this after frontend is deployed
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/snapshots", snapshotRouter);
app.use("/api/v1/materials", materialsRouter);

app.use(notFound);
app.use((err, req, res, next) => {
  console.error("RAW ERROR:", err);
  res.status(500).json({ message: err.message, stack: err.stack });
});
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Database connected.");

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

start();
