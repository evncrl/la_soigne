const connection = require('../config/database');

/* ------------------- ✅ CREATE ORDER (Customer Checkout) ------------------- */
const createOrder = async (req, res) => {
  try {
    const { customer_id, shipping_id, cart } = req.body;

    console.log("📦 Checkout Request:", req.body);

    if (!customer_id || !shipping_id || !cart || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

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

      const orderLineValues = cart.map(item => [
        orderinfo_id,
        item.id,
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

/* ------------------- ✅ FETCH ALL ORDERS (Admin) ------------------- */
const getAllOrders = (req, res) => {
  const query = `
    SELECT o.orderinfo_id, o.date_placed, o.status,
           c.fname, c.lname
    FROM orderinfo o
    JOIN customer c ON o.customer_id = c.customer_id
    ORDER BY o.date_placed DESC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching orders:", err);
      return res.status(500).json({ success: false, message: "Error fetching orders" });
    }

    return res.json({ data: results }); // ✅ DataTables expects {data:[]}
  });
};

/* ------------------- ✅ UPDATE ORDER STATUS (Admin) ------------------- */
const updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value" });
  }

  // ✅ Base query
  let query = `UPDATE orderinfo SET status = ?`;
  const values = [status];

  // ✅ Add timestamps depending on status
  if (status === "Shipped") {
    query += `, date_shipped = CURDATE()`;
  } else if (status === "Delivered") {
    query += `, date_delivered = CURDATE()`;
  }

  query += ` WHERE orderinfo_id = ?`;
  values.push(id);

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error("❌ Error updating order status:", err);
      return res.status(500).json({ success: false, message: "Error updating order status" });
    }

    return res.json({ success: true, message: "Order status updated successfully" });
  });
};

module.exports = { createOrder, getAllOrders, updateOrderStatus };
