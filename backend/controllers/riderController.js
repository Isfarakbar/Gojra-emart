const Rider = require('../models/Rider');
const Order = require('../models/Order');

const releaseRiderIfIdle = async (riderId, excludingOrderId) => {
    if (!riderId) return;
    const activeOrders = await Order.countDocuments({
        _id: { $ne: excludingOrderId },
        assignedRider: riderId,
        status: { $in: ['Packing', 'Out for Delivery'] },
    });
    if (activeOrders === 0) {
        await Rider.updateOne({ _id: riderId, isActive: true }, { $set: { status: 'Available' } });
    }
};

const getRiders = async (req, res) => {
    try {
        const filter = {};
        if (req.query.active === 'true') filter.isActive = true;
        if (req.query.status && ['Available', 'Busy', 'Offline'].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const riders = await Rider.find(filter).sort({ isActive: -1, name: 1 }).lean();
        const activeAssignments = await Order.aggregate([
            {
                $match: {
                    assignedRider: { $ne: null },
                    status: { $in: ['Packing', 'Out for Delivery'] },
                },
            },
            { $group: { _id: '$assignedRider', activeOrders: { $sum: 1 } } },
        ]);
        const counts = new Map(activeAssignments.map(item => [item._id.toString(), item.activeOrders]));

        res.json(riders.map(rider => ({
            ...rider,
            activeOrders: counts.get(rider._id.toString()) || 0,
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createRider = async (req, res) => {
    try {
        const { name, phone, cnic, vehicleType, vehicleNumber, status } = req.body;
        if (!String(name || '').trim() || !String(phone || '').trim()) {
            return res.status(400).json({ message: 'Rider name and phone are required.' });
        }
        const rider = await Rider.create({
            name: String(name).trim(),
            phone: String(phone).trim(),
            cnic: String(cnic || '').trim(),
            vehicleType,
            vehicleNumber: String(vehicleNumber || '').trim(),
            status,
        });
        res.status(201).json(rider);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'A rider with this phone already exists.' });
        res.status(500).json({ message: error.message });
    }
};

const updateRider = async (req, res) => {
    try {
        const rider = await Rider.findById(req.params.id);
        if (!rider) return res.status(404).json({ message: 'Rider not found.' });

        if (req.body.isActive === false || req.body.status === 'Offline') {
            const activeOrders = await Order.countDocuments({
                assignedRider: rider._id,
                status: { $in: ['Packing', 'Out for Delivery'] },
            });
            if (activeOrders > 0) {
                return res.status(400).json({
                    message: 'Reassign this rider’s active orders before taking them offline.',
                });
            }
        }

        const allowed = ['name', 'phone', 'cnic', 'vehicleType', 'vehicleNumber', 'status', 'isActive'];
        for (const field of allowed) {
            if (req.body[field] !== undefined) rider[field] = req.body[field];
        }
        await rider.save();
        res.json(rider);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'A rider with this phone already exists.' });
        res.status(500).json({ message: error.message });
    }
};

const assignRider = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found.' });
        if (['Delivered', 'Cancelled'].includes(order.status)) {
            return res.status(400).json({ message: 'A rider cannot be assigned to a completed order.' });
        }

        const riderId = req.body.riderId;
        const previousRiderId = order.assignedRider;
        if (!riderId) {
            if (order.status === 'Out for Delivery') {
                return res.status(400).json({ message: 'An active delivery cannot be unassigned.' });
            }
            order.assignedRider = null;
            order.riderAssignedAt = undefined;
            await order.save();
            await releaseRiderIfIdle(previousRiderId, order._id);
            return res.json(order);
        }

        const rider = await Rider.findOne({ _id: riderId, isActive: true });
        if (!rider) return res.status(404).json({ message: 'Active rider not found.' });
        if (rider.status === 'Offline') {
            return res.status(400).json({ message: 'This rider is currently offline.' });
        }

        order.assignedRider = rider._id;
        order.riderAssignedAt = new Date();
        await order.save();
        rider.status = 'Busy';
        await rider.save();
        if (previousRiderId && previousRiderId.toString() !== rider._id.toString()) {
            await releaseRiderIfIdle(previousRiderId, order._id);
        }

        await order.populate('assignedRider', 'name phone vehicleType vehicleNumber status');
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getRiders, createRider, updateRider, assignRider };
