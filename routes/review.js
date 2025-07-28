const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  checkReviewedOrder,
  getAllReviewsForAdmin,
  deleteReview
} = require('../controllers/review');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Submit review
router.post('/', createReview);

// Get product reviews (Customer side)
router.get('/:product_id', getProductReviews);

// Check if order reviewed
router.get('/check/:orderinfo_id/:customer_id', checkReviewedOrder);

// Get all reviews (Admin side)
router.get('/admin/all', verifyToken, isAdmin, getAllReviewsForAdmin);

// Delete a review
router.delete('/:review_id', verifyToken, isAdmin, deleteReview);

module.exports = router;
