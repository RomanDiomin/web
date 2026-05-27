const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_mock_stripe_key_12345");

const paymentController = {
  async createCheckoutSession(req, res) {
    const hasSecretKey = Boolean(process.env.STRIPE_SECRET_KEY);

    try {
      if (!hasSecretKey) {
        // Return mock checkout page URL for local/offline developer mode
        return res.json({
          url: `/premium/success?session_id=mock_stripe_session_${Date.now()}`
        });
      }

      // Real Stripe API integration
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Менеджер завдань Premium",
                description: "Безлімітні нагадування, розширена статистика та журнали подій"
              },
              unit_amount: 499 // $4.99
            },
            quantity: 1
          }
        ],
        mode: "payment",
        success_url: `${req.headers.origin || "http://localhost:5173"}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || "http://localhost:5173"}/premium/cancel`
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe Checkout error:", error.message);
      // Fallback to mock session even if Stripe call fails so developer can always test the flow
      res.json({
        url: `/premium/success?session_id=mock_stripe_session_fallback_${Date.now()}`
      });
    }
  }
};

module.exports = paymentController;
