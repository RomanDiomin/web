const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const swaggerUi = require("swagger-ui-express");

const { sequelize, ensureDatabaseExists } = require("./db_sequelize");
const { initMongo } = require("./db_mongo");
const swaggerDocument = require("./swagger");
const { startDeadlineEmailWorker } = require("./deadlineEmailWorker");

// Import MVC Models for server-side EJS reports
const User = require("./models/User");
const Task = require("./models/Task");

// Import MVC Routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Websockets Server Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
app.set("io", io); // Expose io instance to MVC controllers

const port = Number(process.env.PORT || 3000);
let dbReady = false;
const jwtSecret = process.env.JWT_SECRET || "change_me_secret";

// Configure EJS Template Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors());
app.use(express.json());

// Load MVC endpoints
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/payment", paymentRoutes);

// Server-rendered Stats Report using EJS Templating
app.get("/report", async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).send("<h2>Неавторизовано: відсутній токен авторизації.</h2>");
  }

  try {
    const userPayload = jwt.verify(token, jwtSecret);
    
    // Query MySQL database using Sequelize ORM
    const user = await User.findByPk(userPayload.userId);
    if (!user) return res.status(404).send("<h2>Користувача не знайдено</h2>");

    const total = await Task.count({ where: { user_id: user.id } });
    const newCount = await Task.count({ where: { user_id: user.id, status: "new" } });
    const progressCount = await Task.count({ where: { user_id: user.id, status: "in_progress" } });
    const doneCount = await Task.count({ where: { user_id: user.id, status: "done" } });

    const tasks = await Task.findAll({
      where: { user_id: user.id },
      order: [["created_at", "DESC"]]
    });

    res.render("report", {
      user: { name: user.name },
      stats: { total, new: newCount, progress: progressCount, done: doneCount },
      tasks
    });
  } catch (err) {
    res.status(401).send("<h2>Неавторизовано: недійсний токен.</h2>");
  }
});

// Swagger API Documentations
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve React Frontend client build assets
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// API health endpoint
app.get("/health", async (req, res) => {
  try {
    if (!dbReady) {
      return res.status(503).json({ ok: false, message: "Database is not ready" });
    }
    await sequelize.authenticate();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Fallback index html route for React SPA routing
app.get("*", (req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, "../frontend/dist") });
});

// Websocket Events Connections
io.on("connection", (socket) => {
  console.log(`[socket] Client connected: ${socket.id}`);
  
  socket.on("disconnect", () => {
    console.log(`[socket] Client disconnected: ${socket.id}`);
  });
});

async function startServer() {
  startDeadlineEmailWorker({ isDbReady: () => dbReady });

  server.listen(port, () => {
    console.log(`Task Manager API is running on port ${port}`);
  });

  try {
    await ensureDatabaseExists();
    await sequelize.sync();
    dbReady = true;
    console.log("Sequelize MySQL schema synchronized successfully");
    
    // Connect to NoSQL logs database
    await initMongo();
  } catch (error) {
    console.error("Database initialization failed. API is up, DB endpoints disabled:", error.message);
  }
}

startServer();
