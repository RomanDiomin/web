const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const jwtSecret = process.env.JWT_SECRET || "change_me_secret";

function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

const authController = {
  async register(req, res) {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 6) {
      return res.status(400).json({
        message: "name, email and password (min 6 chars) are required"
      });
    }

    try {
      const exists = await User.findOne({ where: { email } });
      if (exists) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password_hash: passwordHash
      });

      const safeUser = { id: user.id, name: user.name, email: user.email };
      const token = createToken(safeUser);
      return res.status(201).json({ user: safeUser, token });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Failed to register" });
    }
  },

  async login(req, res) {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const safeUser = { id: user.id, name: user.name, email: user.email };
      const token = createToken(safeUser);
      return res.json({ user: safeUser, token });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Failed to login" });
    }
  }
};

module.exports = authController;
