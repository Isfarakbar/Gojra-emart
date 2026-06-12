require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');

// Sample Data with Unsplash Images
const categories = [
    { name: 'Fruits & Veg', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=60' },
    { name: 'Dairy & Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=500&q=60' },
    { name: 'Bakery', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=60' },
    { name: 'Beverages', image: 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=500&q=60' },
    { name: 'Snacks', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=500&q=60' }
];

const products = [
    {
        name: 'Fresh Red Apples',
        price: 250,
        description: 'Crisp and sweet red apples, perfect for a healthy snack.',
        categoryName: 'Fruits & Veg',
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=60',
        stock: 50
    },
    {
        name: 'Organic Bananas',
        price: 120,
        description: 'Rich in potassium, great for energy and digestion.',
        categoryName: 'Fruits & Veg',
        imageUrl: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=500&q=60',
        stock: 100
    },
    {
        name: 'Farm Fresh Eggs (12 pcs)',
        price: 350,
        description: 'High-quality farm eggs, rich in protein.',
        categoryName: 'Dairy & Eggs',
        imageUrl: 'https://images.unsplash.com/photo-1598965402089-897ce52e8355?auto=format&fit=crop&w=500&q=60',
        stock: 30
    },
    {
        name: 'Full Cream Milk (1L)',
        price: 180,
        description: 'Pure and fresh full cream milk.',
        categoryName: 'Dairy & Eggs',
        imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=60',
        stock: 40
    },
    {
        name: 'Whole Wheat Bread',
        price: 150,
        description: 'Freshly baked whole wheat bread, high in fiber.',
        categoryName: 'Bakery',
        imageUrl: 'https://images.unsplash.com/photo-1598373182133-52452f7691f3?auto=format&fit=crop&w=500&q=60',
        stock: 25
    },
    {
        name: 'Croissant Pack (4 pcs)',
        price: 450,
        description: 'Buttery and flaky croissants.',
        categoryName: 'Bakery',
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f40388085?auto=format&fit=crop&w=500&q=60',
        stock: 15
    },
    {
        name: 'Orange Juice (1L)',
        price: 300,
        description: '100% natural orange juice, no added sugar.',
        categoryName: 'Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60',
        stock: 20
    },
    {
        name: 'Cola Can (330ml)',
        price: 80,
        description: 'Refreshing cola drink.',
        categoryName: 'Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60',
        stock: 100
    },
    {
        name: 'Potato Chips (Salted)',
        price: 50,
        description: 'Crispy salted potato chips.',
        categoryName: 'Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=60',
        stock: 60
    },
    {
        name: 'Chocolate Bar',
        price: 100,
        description: 'Smooth milk chocolate bar.',
        categoryName: 'Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b706521bf?auto=format&fit=crop&w=500&q=60',
        stock: 80
    },
    {
        name: 'Fresh Spinach',
        price: 60,
        description: 'Green leafy spinach, fresh from the farm.',
        categoryName: 'Fruits & Veg',
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=60',
        stock: 80
    },
    {
        name: 'Greek Yogurt',
        price: 220,
        description: 'Thick and creamy greek yogurt.',
        categoryName: 'Dairy & Eggs',
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=60',
        stock: 80
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear old data
        await Category.deleteMany({});
        await Product.deleteMany({});
        console.log('Cleared existing data');

        // Insert Categories
        // Logic to insert categories and keep track of IDs
        const categoryMap = {};
        for (const cat of categories) {
            const newCat = await Category.create(cat);
            categoryMap[cat.name] = newCat._id;
        }
        console.log(`Inserted ${categories.length} categories`);

        // Insert Products
        const productsWithIds = products.map(p => ({
            ...p,
            category: categoryMap[p.categoryName]
        }));

        await Product.insertMany(productsWithIds);
        console.log(`Inserted ${products.length} products`);

        console.log('Seeding Complete!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
