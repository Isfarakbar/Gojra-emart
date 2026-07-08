const Order = require('../models/Order');

const getDateRange = (query) => {
    const start = query.startDate ? new Date(query.startDate) : new Date();
    const end = query.endDate ? new Date(query.endDate) : new Date(start);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

// @desc    Get cash/order report
// @route   GET /api/reports/cash
// @access  Private/Admin
const getCashReport = async (req, res) => {
    try {
        const { start, end } = getDateRange(req.query);
        const baseMatch = {
            createdAt: { $gte: start, $lte: end },
        };
        const revenueMatch = {
            ...baseMatch,
            status: { $ne: 'Cancelled' },
        };

        const [summary] = await Order.aggregate([
            { $match: revenueMatch },
            {
                $group: {
                    _id: null,
                    grossSales: { $sum: '$itemsPrice' },
                    deliveryFees: { $sum: '$deliveryFee' },
                    totalCash: { $sum: '$totalPrice' },
                    orderCount: { $sum: 1 },
                }
            }
        ]);

        const statusBreakdown = await Order.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$totalPrice' },
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const recentOrders = await Order.find(baseMatch)
            .populate('user', 'name phone email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            range: { start, end },
            summary: summary || {
                grossSales: 0,
                deliveryFees: 0,
                totalCash: 0,
                orderCount: 0,
            },
            statusBreakdown,
            recentOrders,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCashReport,
};
