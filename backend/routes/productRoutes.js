const express = require('express');
const router = express.Router();
const {
    getProducts,
    getAdminProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getLowStockProducts
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

router.param('id', validateObjectIdParam('product ID'));

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.route('/search').get(searchProducts);
router.route('/low-stock').get(protect, admin, getLowStockProducts);
router.route('/admin').get(protect, admin, getAdminProducts);
router.route('/:id').get(getProductById).put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);

module.exports = router;
