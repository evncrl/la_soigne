const express = require('express');
const cors = require('cors');
const upload = require('../middlewares/upload');  // adjust path accordingly
const router = express.Router();

const {
  registerUser,
  loginUser,
  updateUser,
  getUserProfile,
  getAllUsers,       // ✅ NEW
  updateUserStatus   // ✅ NEW
} = require('../controllers/user');

// ✅ Apply CORS if needed
router.use(cors());

// User routes (existing)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/customers/:id', getUserProfile);
router.post('/update-profile', upload.single('image'), updateUser);

// ✅ Admin routes (NEW)
router.get('/users', getAllUsers); // fetch all users
router.put('/users/:id/status', updateUserStatus); // update user status

module.exports = router;
