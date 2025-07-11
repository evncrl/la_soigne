const express = require('express');
const cors = require('cors');
const upload = require('../middlewares/upload');  // adjust path accordingly
const router = express.Router();

const {
  registerUser,
  loginUser,
  updateUser,
  getUserProfile
} = require('../controllers/user');

// User routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/customers/:id', getUserProfile);
router.post('/update-profile', upload.single('image'), updateUser);

module.exports = router;
