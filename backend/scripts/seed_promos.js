require('dotenv').config();

const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode');

const promos = [
    {
        code: 'WELCOME10',
        description: '10% off for new and returning customers',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 1000,
        maxDiscountAmount: 300,
        usageLimit: 500,
        isActive: true,
    },
    {
        code: 'SAVE200',
        description: 'Flat Rs. 200 off on larger grocery baskets',
        discountType: 'fixed',
        discountValue: 200,
        minOrderAmount: 2500,
        maxDiscountAmount: 0,
        usageLimit: 300,
        isActive: true,
    },
];

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    for (const promo of promos) {
        await PromoCode.updateOne(
            { code: promo.code },
            { $set: promo },
            { upsert: true }
        );
    }

    console.log(`Seeded ${promos.length} promo codes`);
};

run()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
