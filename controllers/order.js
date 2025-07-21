const connection = require("../config/database");

// ✅ Place Order (Checkout)
exports.createOrder = async (req, res) => {
  const { customer_id, shipping_id, items } = req.body;

  if (!customer_id || !shipping_id || !items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Missing customer_id, shipping_id, or items",
    });
  }

  try {
    // 1. Insert into orderinfo
    const [orderResult] = await connection
      .promise()
      .query(
        `INSERT INTO orderinfo (customer_id, date_placed, shipping_id, status) 
         VALUES (?, CURDATE(), ?, 'Pending')`,
        [customer_id, shipping_id]
      );

    const orderinfo_id = orderResult.insertId;

    // 2. Insert items into orderline
    const orderLines = items.map((item) => [
      orderinfo_id,
      item.product_id, // ✅ This matches orderline.product_id
      item.quantity,
    ]);

    await connection
      .promise()
      .query(
        `INSERT INTO orderline (orderinfo_id, product_id, quantity) VALUES ?`,
        [orderLines]
      );

    res.status(200).json({
      success: true,
      message: "Order placed successfully",
      orderinfo_id,
    });
  } catch (err) {
    console.error("❌ Order Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
