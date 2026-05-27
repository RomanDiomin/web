const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const Task = require("./models/Task");
const User = require("./models/User");

function isEmailEnabled() {
  return String(process.env.EMAIL_NOTIFICATIONS_ENABLED || "").toLowerCase() === "true";
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

function composeMessage(task, userName) {
  const dueText = task.due_at
    ? new Date(task.due_at).toLocaleString("uk-UA")
    : "Невідомо";
  const safeDescription = task.description ? `Опис: ${task.description}\n` : "";
  return {
    subject: `Нагадування: дедлайн задачі "${task.title}"`,
    text:
      `Привіт, ${userName}!\n\n` +
      `Наближається або настав дедлайн задачі:\n` +
      `Назва: ${task.title}\n` +
      `${safeDescription}` +
      `Дедлайн: ${dueText}\n` +
      `Статус: ${task.status}\n\n` +
      `Зайди в Task Manager, щоб оновити задачу.\n`
  };
}

async function sendDueDeadlineEmails(transporter, fromEmail) {
  // Query tasks where deadline has passed, not done, and notification is pending
  const tasks = await Task.findAll({
    where: {
      due_at: {
        [Op.ne]: null,
        [Op.lte]: new Date()
      },
      status: {
        [Op.ne]: "done"
      },
      deadline_notified_at: null
    },
    include: [{
      model: User,
      required: true
    }],
    order: [["due_at", "ASC"]],
    limit: 100
  });

  for (const task of tasks) {
    const user = task.User; // Associated User model
    if (!user) continue;

    const message = composeMessage(task, user.name);
    try {
      await transporter.sendMail({
        from: fromEmail,
        to: user.email,
        subject: message.subject,
        text: message.text
      });
      
      task.deadline_notified_at = new Date();
      await task.save();
      console.log(`[email] Sent notification to ${user.email} for task ${task.id}`);
    } catch (error) {
      console.error(`[email] Failed to send deadline notification for task ${task.id}:`, error.message);
    }
  }
}

function startDeadlineEmailWorker({ isDbReady }) {
  if (!isEmailEnabled()) {
    console.log("[email] Notifications are disabled (EMAIL_NOTIFICATIONS_ENABLED != true)");
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[email] SMTP config is incomplete, email notifications are disabled.");
    return;
  }

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const intervalMs = Math.max(15000, Number(process.env.EMAIL_CHECK_INTERVAL_MS || 60000));
  let isRunning = false;

  const tick = async () => {
    if (isRunning || !isDbReady()) return;
    isRunning = true;
    try {
      await sendDueDeadlineEmails(transporter, fromEmail);
    } catch (error) {
      console.error("[email] Deadline email worker failed:", error.message);
    } finally {
      isRunning = false;
    }
  };

  setInterval(tick, intervalMs);
  setTimeout(tick, 8000);
  console.log(`[email] Deadline email worker started (interval ${intervalMs}ms)`);
}

module.exports = {
  startDeadlineEmailWorker
};
