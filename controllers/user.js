const connection = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/* ✅ Register User */
const registerUser = async (req, res) => {
  const { fname, lname, password, confirmPassword, email } = req.body;

  if (!fname || !lname || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const name = `${fname} ${lname}`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userSql = `
    INSERT INTO users (name, password, email, role, profile_image, status, created_at)
    VALUES (?, ?, ?, 'User', 'default.jpg', 'Active', NOW())
  `;

  try {
    connection.execute(userSql, [name, hashedPassword, email], (err, result) => {
      if (err instanceof Error) {
        console.log(err);

        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'Email already exists' });
        }

        return res.status(500).json({ error: 'Database error occurred' });
      }

      return res.status(200).json({
        success: true,
        message: 'Registration successful',
        result
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'An error occurred during registration' });
  }
};

/* ✅ Login User (Generate + Save Token) */
const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const sql = 'SELECT id, name, email, password, role FROM users WHERE email = ? AND status = "Active"';
  connection.execute(sql, [email], async (err, results) => {
    if (err) {
      console.error('Login DB Error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    const user = results[0];

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Incorrect email or password' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'yourSecretKey',
        { expiresIn: '1h' }
      );

      // ✅ Save the token to remember_token column
      const updateTokenSql = `UPDATE users SET remember_token = ?, updated_at = NOW() WHERE id = ?`;
      connection.execute(updateTokenSql, [token, user.id], (updateErr) => {
        if (updateErr) {
          console.error('❌ Error saving token to DB:', updateErr);
        } else {
          console.log(`✅ Token saved for user ID ${user.id}`);
        }
      });

      delete user.password;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user
      });
    } catch (bcryptError) {
      console.error('Password comparison error:', bcryptError);
      return res.status(500).json({ success: false, message: 'Error verifying password' });
    }
  });
};

/* ✅ Logout User (Remove Token) */
const logoutUser = (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  const sql = `UPDATE users SET remember_token = NULL, updated_at = NOW() WHERE id = ?`;

  connection.execute(sql, [userId], (err, result) => {
    if (err) {
      console.error('Logout DB Error:', err);
      return res.status(500).json({ success: false, message: 'Error logging out' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'Logout successful' });
  });
};

/* ✅ Get User Profile (Customer Table) */
const getUserProfile = (req, res) => {
  const userId = req.params.id;
  const sql = 'SELECT * FROM customer WHERE user_id = ?';

  connection.execute(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.status(200).json({ success: true, data: results[0] });
  });
};

/* ✅ Update or Insert Profile */
const updateUser = (req, res) => {
  console.log("Update Profile Body:", req.body);
  console.log("Uploaded File:", req.file);

  const { title, fname, lname, addressline, town, phone, userId } = req.body;

  let image = null;
  if (req.file) {
    image = req.file.path.replace(/\\/g, "/");
  }

  const userSql = `
    INSERT INTO customer 
      (title, fname, lname, addressline, town, phone, image_path, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      title = VALUES(title),
      fname = VALUES(fname),
      lname = VALUES(lname),
      addressline = VALUES(addressline),
      town = VALUES(town),
      phone = VALUES(phone),
      image_path = IF(VALUES(image_path) IS NOT NULL, VALUES(image_path), image_path)
  `;

  const params = [
    title || null,
    fname || null,
    lname || null,
    addressline || null,
    town || null,
    phone || null,
    image,
    userId
  ];

  connection.execute(userSql, params, (err, result) => {
    if (err) {
      console.log("❌ Update Profile Error:", err);
      return res.status(400).json({ success: false, error: err.message });
    }

    return res.status(200).json({
      success: true,
      message: '✅ Profile updated successfully!',
      result
    });
  });
};

/* ✅ Deactivate User */
const deactivateUser = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const sql = 'UPDATE users SET deleted_at = ? WHERE email = ?';
  const timestamp = new Date();

  connection.execute(sql, [timestamp, email], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Error deactivating user', details: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      email,
      deleted_at: timestamp
    });
  });
};

/* ✅ Admin - Fetch all users */
const getAllUsers = (req, res) => {
  const sql = 'SELECT id, name, email, role, profile_image, status, created_at FROM users';
  connection.execute(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.status(200).json({ success: true, data: results });
  });
};

/* ✅ Admin - Update user status */
const updateUserStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Active', 'Deactivated'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const sql = 'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?';
  connection.execute(sql, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ success: true, message: 'User status updated successfully' });
  });
};

/* ✅ Admin - Update user role */
const updateUserRole = (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['Admin', 'User'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role value' });
  }

  const sql = 'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?';
  connection.execute(sql, [role, id], (err, result) => {
    if (err) {
      console.error('Error updating role:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ success: true, message: 'User role updated successfully' });
  });
};

/* ✅ Admin - Combined update for role & status */
const updateUserByAdmin = (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  if (!['Admin', 'User'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role value' });
  }
  if (!['Active', 'Deactivated'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const sql = 'UPDATE users SET role = ?, status = ?, updated_at = NOW() WHERE id = ?';
  connection.execute(sql, [role, status, id], (err, result) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ success: true, message: 'User updated successfully' });
  });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser, // ✅ added
  updateUser,
  deactivateUser,
  getUserProfile,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  updateUserByAdmin
};
