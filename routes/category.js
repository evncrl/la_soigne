const express = require('express');
const router = express.Router();
const { 
    getAllCategories,
    getSingleCategory,
    createCategory,
    updateCategory,
    deleteCategory, } = require('../controllers/category');


router.get('/categories', getAllCategories);
router.get('/categories/:id', getSingleCategory);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
module.exports = router;