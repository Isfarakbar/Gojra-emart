const express = require('express');
const router = express.Router();
const { getCategories, getAdminCategories, createCategory, deleteCategory, updateCategory } = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

router.param('id', validateObjectIdParam('category ID'));

router.route('/').get(getCategories).post(protect, admin, createCategory);
router.route('/admin').get(protect, admin, getAdminCategories);
router.route('/:id').delete(protect, admin, deleteCategory).put(protect, admin, updateCategory);

module.exports = router;
