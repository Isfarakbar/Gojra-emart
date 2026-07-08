const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sendNotification = require('../utils/sendNotification');
const { getOrCreateSettings } = require('./storeSettingsController');

const ORDER_PAGE_SIZE = 20;
const VALID_ORDER_STATUSES = ['Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];
const CUSTOMER_CANCEL_ALLOWED_STATUSES = ['Placed', 'Confirmed'];

const reserveStock = async (items) => {
    const reservedItems = [];

    for (const item of items) {
        const query = item.variant
            ? { _id: item.product, 'variants.unit': item.variant, 'variants.stock': { $gte: item.qty } }
            : { _id: item.product, stock: { $gte: item.qty } };
        const update = item.variant
            ? { $inc: { 'variants.$.stock': -item.qty } }
            : { $inc: { stock: -item.qty } };

        const result = await Product.updateOne(query, update);

        if (result.modifiedCount !== 1) {
            await restoreStock(reservedItems);
            throw new Error(`Only limited stock is available for ${item.name}. Please refresh your cart.`);
        }

        reservedItems.push(item);
    }
};

const restoreStock = async (items) => {
    for (const item of items) {
        if (item.variant) {
            await Product.updateOne(
                { _id: item.product, 'variants.unit': item.variant },
                { $inc: { 'variants.$.stock': item.qty } }
            );
        } else {
            await Product.updateOne(
                { _id: item.product },
                { $inc: { stock: item.qty } }
            );
        }
    }
};

const sendOrderStatusNotification = async (order) => {
    if (order.user && order.user.fcmToken) {
        let notificationTitle = 'Order Update';
        let notificationBody = `Your order #${order._id.toString().substring(0, 6).toUpperCase()} is now: ${order.status}`;

        if (order.status === 'Out for Delivery') {
            notificationTitle = 'Order Out for Delivery';
            notificationBody = 'Your order is on the way to you. Please keep cash ready if paying by COD.';
        } else if (order.status === 'Delivered') {
            notificationTitle = 'Order Delivered';
            notificationBody = 'Your order has been successfully delivered. Enjoy!';
        } else if (order.status === 'Cancelled') {
            notificationTitle = 'Order Cancelled';
            notificationBody = 'Your order has been cancelled.';
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
};

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

        if (!shippingAddress?.street || !shippingAddress?.area || !shippingAddress?.city || !shippingAddress?.phone) {
            return res.status(400).json({ message: 'Complete shipping address is required.' });
        }

        const storeSettings = await getOrCreateSettings();
        if (!storeSettings.isStoreOpen) {
            return res.status(403).json({ message: storeSettings.closedMessage || 'Store is currently closed.' });
        }

        // Store GPS coordinates when the app provides them. Do not restrict by distance.
        let locationData = null;
        if (location && location.latitude != null && location.longitude != null) {
            const latitude = Number(location.latitude);
            const longitude = Number(location.longitude);

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude) ||
                latitude < -90 ||
                latitude > 90 ||
                longitude < -180 ||
                longitude > 180
            ) {
                return res.status(400).json({ message: 'Invalid order location coordinates.' });
            }

            locationData = {
                latitude,
                longitude
            };
        }

        const validatedItems = [];
        let itemsPrice = 0;

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

            itemsPrice += serverPrice * qty;
            validatedItems.push({
                name: item.variant ? `${product.name} (${item.variant})` : product.name,
                qty,
                image: product.imageUrl,
                price: serverPrice,
                variant: item.variant,
                product: product._id
            });
        }

        if (itemsPrice < storeSettings.minimumOrderAmount) {
            return res.status(400).json({
                message: `Minimum order amount is Rs. ${storeSettings.minimumOrderAmount}. Please add more items to continue.`
            });
        }

        const deliveryFee = storeSettings.freeDeliveryAbove > 0 && itemsPrice >= storeSettings.freeDeliveryAbove
            ? 0
            : storeSettings.deliveryFee;
        const calculatedTotal = itemsPrice + deliveryFee;

        await reserveStock(validatedItems);

        let createdOrder;
        try {
            const order = new Order({
                orderItems: validatedItems,
                user: req.user._id,
                shippingAddress,
                paymentMethod: 'COD',
                itemsPrice,
                deliveryFee,
                totalPrice: calculatedTotal,
                location: locationData
            });

            createdOrder = await order.save();
        } catch (error) {
            await restoreStock(validatedItems);
            throw error;
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(error.message.includes('stock') ? 400 : 500).json({ message: error.message });
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
        const query = {};

        if (req.query.status && VALID_ORDER_STATUSES.includes(req.query.status)) {
            query.status = req.query.status;
        }

        if (req.query.search && req.query.search.trim()) {
            const search = req.query.search.trim();
            const matchingUsers = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            const searchConditions = [
                { user: { $in: matchingUsers.map(user => user._id) } }
            ];

            if (/^[0-9a-fA-F]{24}$/.test(search)) {
                searchConditions.push({ _id: search });
            }

            query.$or = searchConditions;
        }

        const orders = await Order.find(query)
            .populate('user', 'id name email phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * ORDER_PAGE_SIZE)
            .limit(ORDER_PAGE_SIZE);
        const total = await Order.countDocuments(query);

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

        const previousStatus = order.status;
        if (previousStatus === 'Cancelled') {
            return res.status(400).json({ message: 'Cancelled orders cannot be updated.' });
        }

        order.status = req.body.status;

        if (req.body.status === 'Cancelled') {
            await restoreStock(order.orderItems);
        }

        const updatedOrder = await order.save();

        await sendOrderStatusNotification(order);

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel logged-in user's order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelMyOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        if (!CUSTOMER_CANCEL_ALLOWED_STATUSES.includes(order.status)) {
            return res.status(400).json({ message: 'This order can no longer be cancelled.' });
        }

        await restoreStock(order.orderItems);
        order.status = 'Cancelled';
        const updatedOrder = await order.save();

        await sendOrderStatusNotification(order);

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
    updateOrderStatus,
    cancelMyOrder
};
