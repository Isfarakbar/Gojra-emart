const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getLowStockProducts
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.route('/search').get(searchProducts);
router.route('/low-stock').get(protect, admin, getLowStockProducts);
router.route('/:id').get(getProductById).put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);

module.exports = router;
