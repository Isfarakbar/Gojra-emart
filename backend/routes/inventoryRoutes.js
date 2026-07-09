const express = require('express');
const { getInventory, getMovements, adjustStock } = require('../controllers/inventoryController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('productId', validateObjectIdParam('product ID'));
router.use(protect, admin);
router.get('/', getInventory);
router.get('/movements', getMovements);
router.post('/:productId/adjust', adjustStock);

module.exports = router;
