const connection = require('../config/database');
const { sendStatusUpdateEmail } = require("../utils/mailer");

/* -------------------  CREATE ORDER (Customer Checkout) ------------------- */
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
    SELECT 
      o.orderinfo_id, 
      o.date_placed, 
      o.status,
      c.fname, 
      c.lname
    FROM orderinfo o
    LEFT JOIN customer c ON o.customer_id = c.user_id
    ORDER BY o.date_placed DESC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching orders:", err);
      return res.status(500).json({ success: false, message: "Error fetching orders" });
    }

    return res.json({ data: results });
  });
};

/* ------------------- ✅ UPDATE ORDER STATUS (Admin) ------------------- */
const updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value" });
  }

  let query = `UPDATE orderinfo SET status = ?`;
  const values = [status];

  if (status === "Shipped") {
    query += `, date_shipped = CURDATE()`;
  } else if (status === "Delivered") {
    query += `, date_delivered = CURDATE()`;
  }

  query += ` WHERE orderinfo_id = ?`;
  values.push(id);

  connection.query(query, values, (err) => {
    if (err) {
      console.error("❌ Error updating order status:", err);
      return res.status(500).json({ success: false, message: "Error updating order status" });
    }

    console.log("✅ Status updated in DB");

    // ✅ Kukunin ang email + order details
    const emailQuery = `
      SELECT u.email
      FROM orderinfo o
      JOIN customer c ON o.customer_id = c.user_id
      JOIN users u ON c.user_id = u.id
      WHERE o.orderinfo_id = ?
    `;

    connection.query(emailQuery, [id], (err2, customerResult) => {
      if (err2) {
        console.error("❌ Error fetching customer email:", err2);
        return res.status(500).json({ success: false, message: "Error fetching customer email" });
      }

      if (customerResult.length > 0) {
        const customerEmail = customerResult[0].email;

        // ✅ Kukunin products para sa table
        const detailsQuery = `
          SELECT p.name, p.price, ol.quantity
          FROM orderline ol
          JOIN products p ON ol.product_id = p.id
          WHERE ol.orderinfo_id = ?
        `;

        connection.query(detailsQuery, [id], async (err3, products) => {
          if (err3) {
            console.error("❌ Error fetching order details:", err3);
          } else {
            await sendStatusUpdateEmail(customerEmail, id, status, products);
          }

          return res.json({ success: true, message: "Order status updated & email sent" });
        });
      } else {
        return res.json({ success: true, message: "Order status updated but no email found" });
      }
    });
  });
};

/* ------------------- ✅ FETCH CUSTOMER ORDERS ("My Orders") ------------------- */
const getCustomerOrders = (req, res) => {
  console.log("📌 PARAMS RECEIVED:", req.params);

  const { customer_id } = req.params;
  console.log("📌 customer_id received:", customer_id);

  const query = `
    SELECT o.orderinfo_id, o.date_placed, o.date_shipped, o.date_delivered, o.status
    FROM orderinfo o
    WHERE o.customer_id = ?
    ORDER BY o.date_placed DESC
  `;

  connection.query(query, [customer_id], (err, results) => {
    if (err) {
      console.error("❌ Error fetching customer orders:", err);
      return res.status(500).json({ success: false, message: "Error fetching customer orders" });
    }

    console.log("✅ RESULTS:", results);
    return res.json({ success: true, data: results });
  });
};

/* -------------------  FETCH ORDER ITEMS (Customer View Order Details) ------------------- */
const getOrderItems = (req, res) => {
  const { orderId } = req.params;
  console.log("📌 Fetching items for order:", orderId);

  const query = `
    SELECT 
      p.id AS product_id,
      p.name AS product_name, 
      p.price, 
      ol.quantity
    FROM orderline ol
    JOIN products p ON ol.product_id = p.id
    WHERE ol.orderinfo_id = ?
  `;

  connection.query(query, [orderId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching order items:", err);  // Dapat ganito
      return res.status(500).json({ success: false, message: "Error fetching order items" });
    }

    console.log("✅ Order items fetched:", results);
    return res.json({ success: true, data: results });
  });
};

module.exports = { 
  createOrder, 
  getAllOrders, 
  updateOrderStatus, 
  getCustomerOrders,
  getOrderItems  
};
