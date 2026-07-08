const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get Dashboard Stats
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // 1. Basic Counts
        const totalOrders = await Order.countDocuments();
        const productCount = await Product.countDocuments();
        const userCount = await User.countDocuments();

        // 2. Total Revenue (Sum of all orders or valid orders)
        // Adjust match condition if you only want 'Paid' or 'Delivered' orders
        const revenueMatch = { status: { $ne: 'Cancelled' } };
        const totalRevenueResult = await Order.aggregate([
            { $match: revenueMatch },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPrice" }
                }
            }
        ]);
        const totalSales = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

        // 3. Sales Over Time (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const salesOverTime = await Order.aggregate([
            {
                $match: {
                    ...revenueMatch,
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalPrice" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 4. Order Status Distribution
        const orderStatusDist = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 5. Recent Orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name');

        res.json({
            totalSales,
            totalOrders,
            productCount,
            userCount,
            salesOverTime: salesOverTime.map(item => ({
                date: item._id,
                revenue: item.revenue,
                orders: item.count
            })),
            orderStatusDist: orderStatusDist.map(item => ({
                name: item._id,
                value: item.count
            })),
            recentOrders
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

module.exports = {
    getDashboardStats
};
