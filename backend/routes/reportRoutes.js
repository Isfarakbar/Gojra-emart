const express = require('express');
const router = express.Router();
const { getCashReport } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/cash', protect, admin, getCashReport);

module.exports = router;
