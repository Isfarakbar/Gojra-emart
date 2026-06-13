const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const sendNotification = require('../utils/sendNotification');

const STORE_CENTER = { lat: 31.431049819725455, lng: 73.12663491103483 };
const MAX_RADIUS_KM = 6;
const ORDER_PAGE_SIZE = 20;
const VALID_ORDER_STATUSES = ['Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, location } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        if (paymentMethod && paymentMethod !== 'COD') {
            return res.status(400).json({ message: 'Only Cash on Delivery is available.' });
        }

        if (!location || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            return res.status(400).json({ message: 'Location is required to place an order.' });
        }

        const [lng, lat] = location.coordinates;
        const distance = getDistanceKm(lat, lng, STORE_CENTER.lat, STORE_CENTER.lng);

        console.log(`Location check: user=${lat},${lng} store=${STORE_CENTER.lat},${STORE_CENTER.lng} distance=${distance.toFixed(2)}km`);

        if (distance > MAX_RADIUS_KM) {
            return res.status(400).json({
                message: `Sorry, we only deliver within ${MAX_RADIUS_KM}km of our store. Your location is ${distance.toFixed(1)}km away.`
            });
        }

        if (!shippingAddress?.street || !shippingAddress?.area || !shippingAddress?.city || !shippingAddress?.phone) {
            return res.status(400).json({ message: 'Complete shipping address is required.' });
        }

        const validatedItems = [];
        let calculatedTotal = 0;

        for (const item of orderItems) {
            const product = await Product.findById(item.product);

            if (!product || !product.isActive) {
                return res.status(400).json({ message: `Product unavailable: ${item.name || item.product}` });
            }

            const qty = Number(item.qty);
            if (!Number.isInteger(qty) || qty < 1) {
                return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
            }

            let serverPrice = product.price;
            let serverStock = product.stock;

            if (item.variant) {
                const variant = product.variants.find(v => v.unit === item.variant);
                if (!variant) {
                    return res.status(400).json({ message: `Invalid variant for ${product.name}` });
                }
                serverPrice = variant.price;
                serverStock = variant.stock;
            }

            if (serverStock < qty) {
                return res.status(400).json({ message: `Only ${serverStock} item(s) available for ${product.name}` });
            }

            if (Math.abs(Number(item.price) - serverPrice) > 0.01) {
                return res.status(400).json({ message: `Price changed for ${product.name}. Please refresh your cart.` });
            }

            calculatedTotal += serverPrice * qty;
            validatedItems.push({
                name: item.variant ? `${product.name} (${item.variant})` : product.name,
                qty,
                image: product.imageUrl,
                price: serverPrice,
                variant: item.variant,
                product: product._id
            });
        }

        const order = new Order({
            orderItems: validatedItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod: 'COD',
            totalPrice: calculatedTotal,
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
        const order = await Order.findById(req.params.id).populate('user', 'name email phone');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * ORDER_PAGE_SIZE)
            .limit(ORDER_PAGE_SIZE);

        res.json({ orders, page, limit: ORDER_PAGE_SIZE });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const orders = await Order.find({})
            .populate('user', 'id name email phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * ORDER_PAGE_SIZE)
            .limit(ORDER_PAGE_SIZE);
        const total = await Order.countDocuments();

        res.json({ orders, page, limit: ORDER_PAGE_SIZE, total, pages: Math.ceil(total / ORDER_PAGE_SIZE) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        if (!VALID_ORDER_STATUSES.includes(req.body.status)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }

        const order = await Order.findById(req.params.id).populate('user');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = req.body.status;
        const updatedOrder = await order.save();

        if (order.user && order.user.fcmToken) {
            let notificationTitle = 'Order Update';
            let notificationBody = `Your order #${order._id.toString().substring(0, 6).toUpperCase()} is now: ${order.status}`;

            if (order.status === 'Out for Delivery') {
                notificationTitle = 'Order Out for Delivery';
                notificationBody = 'Your order is on the way to you. Please keep cash ready if paying by COD.';
            } else if (order.status === 'Delivered') {
                notificationTitle = 'Order Delivered';
                notificationBody = 'Your order has been successfully delivered. Enjoy!';
            }

            sendNotification(order.user.fcmToken, notificationTitle, notificationBody, { orderId: order._id.toString() });
        }

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

function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = deg2rad(lat1 - lat2);
    const dLon = deg2rad(lng1 - lng2);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(lat1)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
