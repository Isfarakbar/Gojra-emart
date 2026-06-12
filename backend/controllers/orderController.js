const Order = require('../models/Order');
const Notification = require('../models/Notification');
const sendNotification = require('../utils/sendNotification');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    const STORE_CENTER = { lat: 31.431049819725455, lng: 73.12663491103483 };
    const MAX_RADIUS_KM = 6;

    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
            location
        } = req.body;

        // Validate order items
        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // Validate Location if provided
        if (location && location.coordinates && location.coordinates.length === 2) {
            const [lng, lat] = location.coordinates;

            // Haversine Formula
            const R = 6371; // Radius of the earth in km
            const dLat = deg2rad(lat - STORE_CENTER.lat);
            const dLon = deg2rad(lng - STORE_CENTER.lng);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(STORE_CENTER.lat)) * Math.cos(deg2rad(lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            console.log(`--- Location Debug --- User: ${lat}, ${lng} | Store: ${STORE_CENTER.lat}, ${STORE_CENTER.lng} | Distance: ${distance.toFixed(2)}km`);

            if (distance > MAX_RADIUS_KM) {
                return res.status(400).json({
                    message: `Sorry, we only deliver within ${MAX_RADIUS_KM}km of our store. Your location is ${distance.toFixed(1)}km away.`
                });
            }
        }

        const order = new Order({
            orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            totalPrice,
            location
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = req.body.status;
        const updatedOrder = await order.save();

        // Send Push Notification if FCM token exists
        if (order.user && order.user.fcmToken) {
            let notificationTitle = 'Order Update 📦';
            let notificationBody = `Your order #${order._id.toString().substring(0, 6).toUpperCase()} is now: ${order.status}`;
            
            if (order.status === 'Out for delivery') {
                notificationTitle = 'Order Out for Delivery 🚚';
                notificationBody = 'Your order is on the way to you! Please keep cash ready if paying by COD.';
            } else if (order.status === 'Delivered') {
                notificationTitle = 'Order Delivered ✅';
                notificationBody = 'Your order has been successfully delivered. Enjoy!';
            }

            // Call the utility (fire and forget)
            sendNotification(order.user.fcmToken, notificationTitle, notificationBody, { orderId: order._id.toString() });
        }

        // Create Notification for user
        await Notification.create({
            user: order.user,
            title: 'Order Update',
            message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${order.status}`,
            type: 'order_update',
            relatedId: order._id
        });

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addOrderItems,
    getOrderById,
    getMyOrders,
    getOrders,
    updateOrderStatus
};

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
