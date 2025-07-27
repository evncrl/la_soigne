const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  checkReviewedOrder,
  getAllReviewsForAdmin
} = require('../controllers/review');

// ✅ Submit review
router.post('/', createReview);

// ✅ Get all reviews for a product (Customer side)
router.get('/:product_id', getProductReviews);

// ✅ Check if all products in this order are already reviewed (Customer side)
router.get('/check/:orderinfo_id/:customer_id', checkReviewedOrder);

// ✅ Get all reviews (Admin side)
router.get('/admin/all', getAllReviewsForAdmin);

module.exports = router;
