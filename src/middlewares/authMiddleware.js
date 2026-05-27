const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET || "change_me_secret";

function authMiddleware(req, res, next) {
  const raw = req.headers.authorization || "";
  const [scheme, token] = raw.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = authMiddleware;
// Make it backward compatible in case other files import it from server.js
