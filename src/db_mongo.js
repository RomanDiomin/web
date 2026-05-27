const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/task_manager_logs";
let isConnected = false;

async function initMongo() {
  try {
    // 3 seconds timeout to prevent hanging on startup if MongoDB is missing
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log("MongoDB audit database connected successfully");
  } catch (error) {
    console.warn("MongoDB connection failed (NoSQL audit logging disabled):", error.message);
  }
}

function getIsConnected() {
  return isConnected;
}

module.exports = {
  initMongo,
  getIsConnected
};
