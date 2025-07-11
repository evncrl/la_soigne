const express = require('express');
const router = express.Router();
const upload = require('../utils/multer')
const { getAllItems,
    getSingleItem,
    createItem,
    updateItem,
    deleteItem, } = require('../controllers/item')

router.get('/items', getAllItems)
router.get('/items/:id', getSingleItem)
router.post('/items', upload.array('images', 5), createItem)
router.put('/items/:id', upload.array('images', 5), updateItem)
router.delete('/items/:id', deleteItem)
module.exports = router;