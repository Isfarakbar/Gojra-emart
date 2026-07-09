const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
    assertSafeTestDatabase,
    connectDatabase,
    disconnectDatabase,
} = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const StoreSettings = require('../models/StoreSettings');

const seed = async () => {
    const uri = process.env.MONGO_TEST_URI;
    assertSafeTestDatabase(uri);
    await connectDatabase({ uri, testMode: true });
    await User.db.dropDatabase();

    const credentials = {
        email: 'customer-device@test.local',
        password: 'CustomerDevice123!',
    };
    await User.create({
        name: 'Device Test Customer',
        email: credentials.email,
        password: credentials.password,
        phone: '03001234567',
        address: '12 Main Road, Model Town, Gojra',
        role: 'user',
    });
    const category = await Category.create({
        name: 'Device Test Groceries',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
    });
    await Product.create({
        name: 'Device Test Fresh Milk 1L',
        description: 'Fresh full cream milk prepared for isolated customer workflow testing.',
        price: 250,
        stock: 100,
        category: category._id,
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800',
        isFeatured: true,
    });
    await Product.create({
        name: 'Device Test Basmati Rice 5kg',
        description: 'Long grain basmati rice prepared for isolated customer workflow testing.',
        price: 1850,
        stock: 100,
        category: category._id,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800',
        isFeatured: true,
    });
    await StoreSettings.create({
        storeName: 'Gojra E-Mart Device Test',
        isStoreOpen: true,
        minimumOrderAmount: 100,
        deliveryFee: 100,
        freeDeliveryThreshold: 2000,
        enableDeliverySlots: false,
    });

    console.log(JSON.stringify(credentials));
    await disconnectDatabase();
};

seed().catch(async (error) => {
    console.error(error.message);
    await disconnectDatabase();
    process.exitCode = 1;
});
