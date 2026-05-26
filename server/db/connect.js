const mongoose = require("mongoose");

const connectDB = async (url, maxRetries = 3) => {
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(
        `Database connection attempt ${retryCount + 1}/${maxRetries}...`,
      );

      const connection = await mongoose.connect(url, {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000,
        retryWrites: true,
        w: "majority",
      });

      return connection;
    } catch (error) {
      retryCount++;
      console.warn(`Connection failed: ${error.message}`);

      if (retryCount >= maxRetries) {
        const hint =
          error.message?.includes("whitelist") ||
          error.message?.includes("IP") ||
          error.name === "MongoServerSelectionError"
            ? "\n\nAtlas fix: MongoDB Atlas → Network Access → Add IP Address → " +
              "use your current IP or 0.0.0.0/0 (dev only). Then confirm MONGO_URI uses mongodb+srv://."
            : "";
        throw new Error(error.message + hint);
      }

      const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
      console.warn(`Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
};

module.exports = connectDB;
