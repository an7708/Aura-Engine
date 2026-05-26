const express = require('express');
const router = express.Router();
const {
    getInventory,
    getAnalytics,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
} = require('../controllers/inventory.controller');

router.get('/analytics', getAnalytics);
router.get('/', getInventory);
router.post('/', createProduct);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;