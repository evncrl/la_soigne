const express = require("express");
const router = express.Router();
const db = require("../config/database");

//  Add product to cart
router.post("/", (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({ success: false, message: "Missing user_id or product_id" });
  }

  // Check if product already exists in cart
  const checkQuery = "SELECT * FROM cart WHERE user_id = ? AND product_id = ?";
  db.query(checkQuery, [user_id, product_id], (err, results) => {
    if (err) {
      console.error("❌ MySQL Error (check):", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      //  Update quantity if already exists
      const updateQuery = "UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?";
      db.query(updateQuery, [quantity || 1, user_id, product_id], (err2) => {
        if (err2) {
          console.error("❌ MySQL Error (update):", err2);
          return res.status(500).json({ success: false, message: "Failed to update cart" });
        }
        res.json({ success: true, message: "Cart updated successfully" });
      });
    } else {
      //  Insert new product
      const insertQuery = "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)";
      db.query(insertQuery, [user_id, product_id, quantity || 1], (err3) => {
        if (err3) {
          console.error("❌ MySQL Error (insert):", err3);
          return res.status(500).json({ success: false, message: "Failed to add to cart" });
        }
        res.json({ success: true, message: "Product added to cart" });
      });
    }
  });
});

//  Get cart items for a user
router.get("/:user_id", (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT c.id, c.quantity, p.name, p.price, p.image
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error("❌ MySQL Error (fetch):", err);
      return res.status(500).json({ success: false, message: "Failed to get cart items" });
    }
    res.json({ success: true, data: results });
  });
});

module.exports = router;
