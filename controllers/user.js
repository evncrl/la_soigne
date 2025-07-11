const connection = require('../config/database');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const registerUser = async (req, res) => {
  // {
  //   "fname": "steve",
  //   "lname": "jobs",
  //   "email": "steve@gmail.com",
  //   "password": "password",
  //   "confirmPassword": "password"
  // }
  const { fname, lname, password, confirmPassword, email } = req.body;

  // Validate required fields
  if (!fname || !lname || !email || !password || !confirmPassword) {
    return res.status(400).json({
      error: 'All fields are required'
    });
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({
      error: 'Passwords do not match'
    });
  }

  const name = `${fname} ${lname}`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userSql = 'INSERT INTO users (name, password, email, created_at) VALUES (?, ?, ?, NOW())';
  try {
    connection.execute(userSql, [name, hashedPassword, email], (err, result) => {
      if (err instanceof Error) {
        console.log(err);

        return res.status(401).json({
          error: err
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Registration successful',
        result
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'An error occurred during registration'
    });
  }
};

const loginUser = (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT id, name, email, password FROM users WHERE email = ? AND deleted_at IS NULL';
  connection.execute(sql, [email], async (err, results) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ error: 'Error logging in', details: err });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = results[0];

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // ✅ Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        'yourSecretKey', // Replace this with a secure secret in .env
        { expiresIn: '1h' }
      );

      // ✅ Remove password before sending response
      delete user.password;

      return res.status(200).json({
        token,      // ✅ Include token in the response
        user        // ✅ Include user data
      });

    } catch (bcryptError) {
      console.error("Bcrypt Error:", bcryptError);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};

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


const updateUser = (req, res) => {
  console.log(req.body, req.file);

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
      image_path = VALUES(image_path)
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

  try {
    connection.execute(userSql, params, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated',
        result
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Unexpected error' });
  }
};


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

module.exports = { registerUser, loginUser, updateUser, deactivateUser, getUserProfile};