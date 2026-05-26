require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/auth.js");
const snapshotRouter = require("./routes/snapshot.js");
const materialsRouter = require("./routes/materials.js");


const notFound = require("./middleware/notFound.js");
const errorHandlerMiddleware = require("./middleware/error-handler.js");
const connectDB = require("./db/connect.js");

const app = express();
const port = process.env.PORT || 5000;

// Validate environment variables
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "GOOGLE_CLIENT_ID",
  "EMAIL_USER",
  "EMAIL_PASS",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error("❌ Missing environment variables:", missingVars.join(", "));
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/snapshots", snapshotRouter);
app.use("/api/v1/materials", materialsRouter);


// Error handling
app.use(notFound);
app.use(errorHandlerMiddleware);

// Start server
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
