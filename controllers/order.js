const connection = require('../config/database');
const nodemailer = require('nodemailer');

/* ------------------- ✅ SETUP NODEMAILER (MAILTRAP) ------------------- */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ✅ Reusable Email Function */
async function sendStatusUpdateEmail(customerEmail, orderId, newStatus, products = []) {
  let message = "";

 let statusColor = "#333";

switch (newStatus) {
  case "Shipped":
    statusColor = "#2196F3"; // Blue
    message = `
      <div style="background:${statusColor};color:white;padding:10px 15px;border-radius:5px;
                  display:inline-block;font-size:16px;font-weight:bold;">
        🚚 Your order has been SHIPPED
      </div>
      <p style="margin-top:10px;">You can expect delivery soon. Thank you for shopping with us!</p>
    `;
    break;

  case "Delivered":
    statusColor = "#4CAF50"; // Green
    message = `
      <div style="background:${statusColor};color:white;padding:10px 15px;border-radius:5px;
                  display:inline-block;font-size:16px;font-weight:bold;">
        📦 Your order has been DELIVERED
      </div>
      <p style="margin-top:10px;">We hope you enjoy your purchase. Thank you for choosing La Soigne!</p>
    `;
    break;

  case "Cancelled":
    statusColor = "#F44336"; // Red
    message = `
      <div style="background:${statusColor};color:white;padding:10px 15px;border-radius:5px;
                  display:inline-block;font-size:16px;font-weight:bold;">
        ❌ Your order has been CANCELLED
      </div>
      <p style="margin-top:10px;">If you have questions, please contact our support team.</p>
    `;
    break;

  default:
    statusColor = "#FF9800"; // Orange for others
    message = `
      <div style="background:${statusColor};color:white;padding:10px 15px;border-radius:5px;
                  display:inline-block;font-size:16px;font-weight:bold;">
        ℹ️ Order status: ${newStatus.toUpperCase()}
      </div>
    `;
}

  // ✅ Build Table of Products
  let totalPrice = 0;
  let rows = products
    .map((item) => {
      const price = parseFloat(item.price);
      const subtotal = price * item.quantity;
      totalPrice += subtotal;
      return `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${item.name}</td>
          <td style="padding:8px;border:1px solid #ddd;">${item.quantity}</td>
          <td style="padding:8px;border:1px solid #ddd;">₱${price.toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #ddd;">₱${subtotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const tableHTML = `
    <h4>Order Details (Order #${orderId}):</h4>
    <table style="border-collapse: collapse; width:100%; max-width:500px;">
      <thead>
        <tr style="background:#f2f2f2;">
          <th style="padding:8px;border:1px solid #ddd;">Product</th>
          <th style="padding:8px;border:1px solid #ddd;">Qty</th>
          <th style="padding:8px;border:1px solid #ddd;">Price</th>
          <th style="padding:8px;border:1px solid #ddd;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr style="font-weight:bold;">
          <td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right;">Total:</td>
          <td style="padding:8px;border:1px solid #ddd;">₱${totalPrice.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `;

  try {
    await transporter.sendMail({
      from: '"La Soigne Admin" <no-reply@lasoigne.com>',
      to: customerEmail,
      subject: `Order #${orderId} Status Update: ${newStatus}`,
      html: `
        <h3>Hello,</h3>
        ${message}
        ${tableHTML}
        <p>❤️ La Soigne Team</p>
      `,
    });
    console.log(`✅ Email sent to ${customerEmail}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
}

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
    SELECT 
      o.orderinfo_id, 
      o.date_placed, 
      o.status,
      c.fname, 
      c.lname
    FROM orderinfo o
    LEFT JOIN customer c ON o.customer_id = c.customer_id
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
      JOIN customer c ON o.customer_id = c.customer_id
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


/* ------------------- ✅ FETCH CUSTOMER ORDERS (Customer "My Orders") ------------------- */
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

module.exports = { createOrder, getAllOrders, updateOrderStatus, getCustomerOrders };
