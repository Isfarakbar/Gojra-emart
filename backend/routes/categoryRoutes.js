const express = require('express');
const router = express.Router();
const { getCategories, createCategory, deleteCategory, updateCategory } = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getCategories).post(protect, admin, createCategory);
router.route('/:id').delete(protect, admin, deleteCategory).put(protect, admin, updateCategory);

module.exports = router;
