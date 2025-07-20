const express = require('express');
const cors = require('cors');
const upload = require('../middlewares/upload');  // adjust path accordingly
const router = express.Router();

const {
  registerUser,
  loginUser,
  updateUser,
  getUserProfile,
  getAllUsers,        
  updateUserStatus,   
  updateUserRole,
  updateUserByAdmin    // ✅ NEW combined route for updating role & status
} = require('../controllers/user');

// ✅ Apply CORS middleware (optional, can be removed if handled globally)
router.use(cors());

// ✅ User routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/customers/:id', getUserProfile);
router.post('/update-profile', upload.single('image'), updateUser);

// ✅ Admin routes
router.get('/users', getAllUsers); 
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/update', updateUserByAdmin);  // ✅ NEW ROUTE

module.exports = router;
