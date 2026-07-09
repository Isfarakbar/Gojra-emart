const mongoose = require('mongoose');
const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');

const getInventory = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = 20;
        const search = String(req.query.search || '').trim();
        const filter = {};
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.name = { $regex: escaped, $options: 'i' };
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name')
                .sort({ stock: 1, name: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Product.countDocuments(filter),
        ]);

        const summary = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    productCount: { $sum: 1 },
                    unitsInStock: { $sum: '$stock' },
                    stockValue: { $sum: { $multiply: ['$stock', '$price'] } },
                    lowStockCount: {
                        $sum: { $cond: [{ $lte: ['$stock', '$lowStockThreshold'] }, 1, 0] },
                    },
                    outOfStockCount: {
                        $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] },
                    },
                },
            },
        ]);

        res.json({
            products,
            summary: summary[0] || {
                productCount: 0,
                unitsInStock: 0,
                stockValue: 0,
                lowStockCount: 0,
                outOfStockCount: 0,
            },
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMovements = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = 30;
        const filter = {};
        if (req.query.product && mongoose.isValidObjectId(req.query.product)) {
            filter.product = req.query.product;
        }
        if (req.query.type) filter.type = req.query.type;

        const [movements, total] = await Promise.all([
            InventoryMovement.find(filter)
                .populate('product', 'name imageUrl')
                .populate('performedBy', 'name')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            InventoryMovement.countDocuments(filter),
        ]);
        res.json({ movements, page, pages: Math.ceil(total / limit), total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const adjustStock = async (req, res) => {
    try {
        const { variant, type, reason, quantity, lowStockThreshold } = req.body;
        const allowedTypes = ['Restock', 'Correction', 'Damage', 'Return'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({ message: 'Select a valid inventory adjustment type.' });
        }
        if (!String(reason || '').trim()) {
            return res.status(400).json({ message: 'An adjustment reason is required.' });
        }

        const amount = Number(quantity);
        if (!Number.isInteger(amount) || amount === 0) {
            return res.status(400).json({ message: 'Quantity must be a non-zero whole number.' });
        }

        const variantName = String(variant || '').trim();
        const thresholdUpdate = {};
        if (lowStockThreshold !== undefined) {
            const threshold = Number(lowStockThreshold);
            if (!Number.isInteger(threshold) || threshold < 0) {
                return res.status(400).json({ message: 'Low-stock threshold must be zero or greater.' });
            }
            thresholdUpdate.lowStockThreshold = threshold;
        }

        let previousDocument;
        let previousStock;
        let newStock;
        if (variantName) {
            previousDocument = await Product.findOneAndUpdate(
                {
                    _id: req.params.productId,
                    variants: {
                        $elemMatch: {
                            unit: variantName,
                            stock: { $gte: Math.max(-amount, 0) },
                        },
                    },
                },
                {
                    $inc: { 'variants.$.stock': amount },
                    ...(Object.keys(thresholdUpdate).length ? { $set: thresholdUpdate } : {}),
                },
                { returnDocument: 'before', runValidators: true }
            );
            const previousVariant = previousDocument?.variants.find(item => item.unit === variantName);
            previousStock = previousVariant?.stock;
        } else {
            previousDocument = await Product.findOneAndUpdate(
                { _id: req.params.productId, stock: { $gte: Math.max(-amount, 0) } },
                {
                    $inc: { stock: amount },
                    ...(Object.keys(thresholdUpdate).length ? { $set: thresholdUpdate } : {}),
                },
                { returnDocument: 'before', runValidators: true }
            );
            previousStock = previousDocument?.stock;
        }

        if (!previousDocument || previousStock === undefined) {
            return res.status(400).json({
                message: 'Product or variant was not found, or this adjustment would make stock negative.',
            });
        }

        newStock = previousStock + amount;
        const product = await Product.findById(req.params.productId);
        const movement = await InventoryMovement.create({
            product: product._id,
            variant: variantName,
            type,
            quantityChange: amount,
            previousStock,
            newStock,
            reason: String(reason).trim(),
            performedBy: req.user._id,
        });

        res.json({ message: 'Stock updated.', product, movement });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getInventory, getMovements, adjustStock };
