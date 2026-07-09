const express = require('express');
const { getRiders, createRider, updateRider, assignRider } = require('../controllers/riderController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('id', validateObjectIdParam('rider ID'));
router.param('orderId', validateObjectIdParam('order ID'));
router.use(protect, admin);
router.get('/', getRiders);
router.post('/', createRider);
router.put('/:id', updateRider);
router.put('/assign/:orderId', assignRider);

module.exports = router;
