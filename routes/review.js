const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  checkReviewedOrder
} = require('../controllers/review');

// ✅ Submit review
router.post('/', createReview);

// ✅ Get all reviews for a product
router.get('/:product_id', getProductReviews);

// ✅ Check if all products in this order are already reviewed
router.get('/check/:orderinfo_id/:customer_id', checkReviewedOrder);

module.exports = router;
