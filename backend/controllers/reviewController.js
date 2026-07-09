const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

const updateProductRating = async (productId) => {
    const [summary] = await Review.aggregate([
        {
            $match: {
                product: new mongoose.Types.ObjectId(productId),
                status: 'Approved',
            },
        },
        { $group: { _id: '$product', rating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]);

    await Product.findByIdAndUpdate(productId, {
        rating: summary ? Number(summary.rating.toFixed(1)) : 0,
        reviewCount: summary?.reviewCount || 0,
    });
};

const getProductReviews = async (req, res) => {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
    const filter = { product: req.params.productId, status: 'Approved' };
    const [reviews, total] = await Promise.all([
        Review.find(filter)
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Review.countDocuments(filter),
    ]);

    res.json({ reviews, page, pages: Math.ceil(total / limit), total });
};

const getReviewEligibility = async (req, res) => {
    const productId = req.params.productId;
    const [existingReview, deliveredOrder] = await Promise.all([
        Review.findOne({ user: req.user._id, product: productId }).lean(),
        Order.findOne({
            user: req.user._id,
            status: 'Delivered',
            'orderItems.product': productId,
        }).sort({ createdAt: -1 }).select('_id').lean(),
    ]);

    res.json({
        eligible: Boolean(deliveredOrder),
        existingReview,
        orderId: deliveredOrder?._id || null,
    });
};

const submitReview = async (req, res) => {
    const { productId, rating, comment } = req.body;
    const numericRating = Number(rating);
    const cleanComment = String(comment || '').trim();

    if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: 'Invalid product.' });
    }
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    if (cleanComment.length < 3 || cleanComment.length > 1000) {
        return res.status(400).json({ message: 'Review must be between 3 and 1000 characters.' });
    }

    const deliveredOrder = await Order.findOne({
        user: req.user._id,
        status: 'Delivered',
        'orderItems.product': productId,
    }).sort({ createdAt: -1 }).select('_id');

    if (!deliveredOrder) {
        return res.status(403).json({ message: 'Only customers who received this product can review it.' });
    }

    const review = await Review.findOneAndUpdate(
        { user: req.user._id, product: productId },
        {
            order: deliveredOrder._id,
            rating: numericRating,
            comment: cleanComment,
            status: 'Pending',
        },
        { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await updateProductRating(productId);
    res.status(201).json({
        message: 'Review submitted for approval.',
        review,
    });
};

const getAdminReviews = async (req, res) => {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = {};
    if (req.query.status && ['Pending', 'Approved', 'Rejected'].includes(req.query.status)) {
        filter.status = req.query.status;
    }

    const [reviews, total] = await Promise.all([
        Review.find(filter)
            .populate('user', 'name email phone')
            .populate('product', 'name imageUrl')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Review.countDocuments(filter),
    ]);

    res.json({ reviews, page, pages: Math.ceil(total / limit), total });
};

const moderateReview = async (req, res) => {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status must be Approved or Rejected.' });
    }

    const review = await Review.findByIdAndUpdate(
        req.params.id,
        { status },
        { returnDocument: 'after', runValidators: true }
    );
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    await updateProductRating(review.product);
    res.json(review);
};

const deleteReview = async (req, res) => {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    await updateProductRating(review.product);
    res.json({ message: 'Review deleted.' });
};

module.exports = {
    getProductReviews,
    getReviewEligibility,
    submitReview,
    getAdminReviews,
    moderateReview,
    deleteReview,
};
