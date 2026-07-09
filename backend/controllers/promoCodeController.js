const PromoCode = require('../models/PromoCode');

const normalizeCode = (code) => (code || '').toString().trim().toUpperCase();

const calculatePromoDiscount = (promoCode, itemsPrice) => {
    if (promoCode.discountType === 'percentage') {
        const rawDiscount = itemsPrice * (promoCode.discountValue / 100);
        return promoCode.maxDiscountAmount > 0
            ? Math.min(rawDiscount, promoCode.maxDiscountAmount)
            : rawDiscount;
    }

    return Math.min(promoCode.discountValue, itemsPrice);
};

const validatePromoForOrder = async (code, itemsPrice) => {
    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
        return { promoCode: null, discountAmount: 0 };
    }

    const promoCode = await PromoCode.findOne({ code: normalizedCode });
    if (!promoCode || !promoCode.isActive) {
        const error = new Error('Promo code is invalid or inactive.');
        error.statusCode = 400;
        throw error;
    }

    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
        const error = new Error('Promo code has expired.');
        error.statusCode = 400;
        throw error;
    }

    if (promoCode.usageLimit > 0 && promoCode.usedCount >= promoCode.usageLimit) {
        const error = new Error('Promo code usage limit has been reached.');
        error.statusCode = 400;
        throw error;
    }

    if (itemsPrice < promoCode.minOrderAmount) {
        const error = new Error(`Promo code requires minimum order of Rs. ${promoCode.minOrderAmount}.`);
        error.statusCode = 400;
        throw error;
    }

    return {
        promoCode,
        discountAmount: Math.round(calculatePromoDiscount(promoCode, itemsPrice)),
    };
};

const listPromoCodes = async (req, res) => {
    try {
        const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
        res.json(promoCodes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPromoCode = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            code: normalizeCode(req.body.code),
        };
        const promoCode = await PromoCode.create(payload);
        res.status(201).json(promoCode);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePromoCode = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (payload.code) payload.code = normalizeCode(payload.code);

        const promoCode = await PromoCode.findByIdAndUpdate(req.params.id, payload, {
            returnDocument: 'after',
            runValidators: true,
        });

        if (!promoCode) {
            return res.status(404).json({ message: 'Promo code not found' });
        }

        res.json(promoCode);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deletePromoCode = async (req, res) => {
    try {
        const promoCode = await PromoCode.findByIdAndDelete(req.params.id);
        if (!promoCode) {
            return res.status(404).json({ message: 'Promo code not found' });
        }
        res.json({ message: 'Promo code deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const validatePromoCode = async (req, res) => {
    try {
        const itemsPrice = Number(req.body.itemsPrice);
        if (!Number.isFinite(itemsPrice) || itemsPrice <= 0) {
            return res.status(400).json({ message: 'Valid order amount is required.' });
        }

        const { promoCode, discountAmount } = await validatePromoForOrder(req.body.code, itemsPrice);
        if (!promoCode) {
            return res.status(400).json({ message: 'Promo code is required.' });
        }

        res.json({
            code: promoCode.code,
            description: promoCode.description,
            discountType: promoCode.discountType,
            discountValue: promoCode.discountValue,
            discountAmount,
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports = {
    listPromoCodes,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    validatePromoCode,
    validatePromoForOrder,
};
