const express = require('express');
const router = express.Router();
const {
    createTicket,
    getMyTickets,
    getTickets,
    updateTicket,
} = require('../controllers/supportTicketController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

router.param('id', validateObjectIdParam('ticket ID'));

router.route('/')
    .post(protect, createTicket)
    .get(protect, admin, getTickets);

router.get('/my', protect, getMyTickets);
router.put('/:id', protect, admin, updateTicket);

module.exports = router;
