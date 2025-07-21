const express = require('express');
const cors = require('cors');
const upload = require('../middlewares/upload');
const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser, // ✅ added
  updateUser,
  getUserProfile,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  updateUserByAdmin
} = require('../controllers/user');

router.use(cors());

// ✅ User routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser); // ✅ added
router.get('/customers/:id', getUserProfile);
router.post('/update-profile', upload.single('image'), updateUser);

// ✅ Admin routes
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/update', updateUserByAdmin);

module.exports = router;
