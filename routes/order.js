const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Place order (Checkout)
router.post("/orders", orderController.createOrder);

// Get orders of a specific customer
router.get("/orders/:customer_id", orderController.getCustomerOrders);

module.exports = router;
