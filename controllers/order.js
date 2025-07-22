const connection = require('../config/database');

const createOrder = async (req, res) => {
  try {
    const { customer_id, shipping_id, cart } = req.body;

    console.log("📦 Checkout Request:", req.body);

    if (!customer_id || !shipping_id || !cart || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // ✅ Validate cart items
    for (let item of cart) {
      if (!item.id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: "Invalid cart items" });
      }
    }

    const datePlaced = new Date().toISOString().split("T")[0];
    const status = "Pending";

    const orderInfoQuery = `
      INSERT INTO orderinfo (customer_id, date_placed, shipping_id, status)
      VALUES (?, ?, ?, ?)
    `;

    connection.query(orderInfoQuery, [customer_id, datePlaced, shipping_id, status], (err, result) => {
      if (err) {
        console.error("❌ Error creating order:", err);
        return res.status(500).json({ success: false, message: "Error creating order" });
      }

      const orderinfo_id = result.insertId;
      console.log("✅ Order Created with ID:", orderinfo_id);

      // ✅ Map id → product_id (because orderline table column is product_id)
      const orderLineValues = cart.map(item => [
        orderinfo_id,
        item.id,  // <-- use item.id but it goes into product_id column
        parseInt(item.quantity)
      ]);

      const orderLineQuery = `
        INSERT INTO orderline (orderinfo_id, product_id, quantity)
        VALUES ?
      `;

      connection.query(orderLineQuery, [orderLineValues], (err2) => {
        if (err2) {
          console.error("❌ Error inserting order items:", err2);
          return res.status(500).json({ success: false, message: "Error inserting order items" });
        }

        console.log("✅ Order items inserted successfully");
        return res.json({
          success: true,
          message: "Order placed successfully",
          orderinfo_id
        });
      });
    });

  } catch (error) {
    console.error("❌ Server Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createOrder };
