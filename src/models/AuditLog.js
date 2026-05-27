const mongoose = require("mongoose");
const { getIsConnected } = require("../db_mongo");

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ["create", "update", "delete"]
  },
  taskId: {
    type: Number,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  details: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

// Helper function to log audit actions safely
async function logTaskAction(action, taskId, userId, details = {}) {
  if (!getIsConnected()) {
    console.log(`[Audit Log Mock] Action: ${action}, Task ID: ${taskId}, User ID: ${userId}, Details:`, details);
    return;
  }

  try {
    const log = new AuditLog({ action, taskId, userId, details });
    await log.save();
    console.log(`[Audit Log Mongo] Logged ${action} for Task ${taskId}`);
  } catch (error) {
    console.error("Failed to write Mongo audit log:", error.message);
  }
}

module.exports = {
  AuditLog,
  logTaskAction
};
