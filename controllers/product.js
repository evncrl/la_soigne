// controllers/product.js
const db = require('../config/database');
const path = require('path');
const multer = require('multer');

// ✅ Multer configuration (allow multiple images)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

exports.upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .jpeg, .png, .webp files are allowed!'));
    }
  }
}).array('images', 5); // ✅ up to 5 images

// ✅ CREATE PRODUCT (Multiple Images)
exports.createProduct = (req, res) => {
  const { name, description, price, category } = req.body;

  if (!name || !description || !price || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'At least one image is required' });
  }

  // ✅ Save all filenames, separated by commas
  const images = req.files.map(file => file.filename).join(',');

  const query = `
    INSERT INTO products (name, description, price, category, image, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
  `;

  db.query(query, [name, description, price, category, images], (err, result) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      productId: result.insertId,
      images
    });
  });
};

// ✅ GET ALL PRODUCTS
exports.getAllProducts = (req, res) => {
  const query = 'SELECT * FROM products ORDER BY created_at DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
};

// ✅ UPDATE PRODUCT (with Multiple Images)
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, description, price, category } = req.body;

  if (!name || !description || !price || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let query = `
    UPDATE products
    SET name=?, description=?, price=?, category=?, updated_at=NOW()
    WHERE id=?
  `;
  let values = [name, description, price, category, id];

  if (req.files && req.files.length > 0) {
    const images = req.files.map(file => file.filename).join(',');
    query = `
      UPDATE products
      SET name=?, description=?, price=?, category=?, image=?, updated_at=NOW()
      WHERE id=?
    `;
    values = [name, description, price, category, images, id];
  }

  db.query(query, values, (err) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, message: 'Product updated successfully' });
  });
};

// ✅ DELETE PRODUCT
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM products WHERE id = ?';

  db.query(query, [id], (err) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  });
};
