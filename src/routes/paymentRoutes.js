const express = require("express");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/checkout", authMiddleware, paymentController.createCheckoutSession);

module.exports = router;
