const connection = require('../config/database');

// ✅ CREATE REVIEW (Customer can review only Delivered orders, 1x per product only)
const createReview = (req, res) => {
    const { orderinfo_id, customer_id, product_id, rating, review_text } = req.body;

    console.log("📝 Review Request:", req.body);

    if (!orderinfo_id || !customer_id || !product_id || !rating) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    // ✅ Check if order is delivered & belongs to the customer
    const checkQuery = `
        SELECT status FROM orderinfo 
        WHERE orderinfo_id = ? AND customer_id = ? LIMIT 1
    `;

    connection.query(checkQuery, [orderinfo_id, customer_id], (err, results) => {
        if (err) {
            console.error("❌ Error checking order:", err);
            return res.status(500).json({ success: false, message: "Error checking order" });
        }

        if (results.length === 0) {
            return res.status(403).json({ success: false, message: "Order not found or not yours" });
        }

        if (results[0].status !== "Delivered") {
            return res.status(403).json({ success: false, message: "You can only review delivered orders" });
        }

        // ✅ Check if already reviewed (Prevent duplicate review)
        const alreadyReviewedQuery = `
            SELECT review_id FROM reviews
            WHERE customer_id = ? AND product_id = ? LIMIT 1
        `;

        connection.query(alreadyReviewedQuery, [customer_id, product_id], (err2, existing) => {
            if (err2) {
                console.error("❌ Error checking existing review:", err2);
                return res.status(500).json({ success: false, message: "Error checking existing review" });
            }

            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: "You already reviewed this product" });
            }

            // ✅ Insert review
            const insertQuery = `
                INSERT INTO reviews (orderinfo_id, customer_id, product_id, rating, review_text, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `;

            connection.query(insertQuery, [orderinfo_id, customer_id, product_id, rating, review_text || null], (err3, result) => {
                if (err3) {
                    console.error("❌ Error inserting review:", err3);
                    return res.status(500).json({ success: false, message: "Error submitting review" });
                }

                console.log("✅ Review Saved with ID:", result.insertId);
                return res.json({ success: true, message: "Review submitted successfully!" });
            });
        });
    });
};

// ✅ GET REVIEWS FOR A PRODUCT (for future charts & displaying reviews)
const getProductReviews = (req, res) => {
    const { product_id } = req.params;

    const query = `
        SELECT r.review_id, r.rating, r.review_text, r.created_at, c.fname, c.lname
        FROM reviews r
        JOIN customer c ON r.customer_id = c.customer_id
        WHERE r.product_id = ? AND r.deleted_at IS NULL
        ORDER BY r.created_at DESC
    `;

    connection.query(query, [product_id], (err, results) => {
        if (err) {
            console.error("❌ Error fetching reviews:", err);
            return res.status(500).json({ success: false, message: "Error fetching reviews" });
        }

        return res.json({ success: true, data: results });
    });
};

// ✅ CHECK IF ORDER FULLY REVIEWED (All products in this order already reviewed)
const checkReviewedOrder = (req, res) => {
    const { orderinfo_id, customer_id } = req.params;

    const query = `
        SELECT 
            (SELECT COUNT(*) FROM order_items oi WHERE oi.orderinfo_id = ?) AS total_items,
            (SELECT COUNT(*) FROM reviews r WHERE r.orderinfo_id = ? AND r.customer_id = ?) AS reviewed_items
    `;

    connection.query(query, [orderinfo_id, orderinfo_id, customer_id], (err, results) => {
        if (err) {
            console.error("❌ Error checking reviewed order:", err);
            return res.status(500).json({ success: false, message: "Error checking reviewed order" });
        }

        const total = results[0].total_items;
        const reviewed = results[0].reviewed_items;
        const fullyReviewed = total === reviewed && total > 0;

        return res.json({ success: true, fullyReviewed, total, reviewed });
    });
};

module.exports = { createReview, getProductReviews, checkReviewedOrder };
