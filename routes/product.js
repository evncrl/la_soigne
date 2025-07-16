const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');

// ✅ CREATE
router.post(
  '/products',
  productController.upload,
  productController.createProduct
);

// ✅ READ
router.get('/products', productController.getAllProducts);

// ✅ UPDATE
router.put(
  '/products/:id',
  productController.upload,  // ✅ Important for updating image
  productController.updateProduct
);

// ✅ DELETE
router.delete('/products/:id', productController.deleteProduct);

module.exports = router;
