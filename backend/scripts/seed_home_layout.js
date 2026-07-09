require('dotenv').config();

const mongoose = require('mongoose');
const HomePageSettings = require('../models/HomePageSettings');
const HomeSection = require('../models/HomeSection');
const Category = require('../models/Category');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    await HomePageSettings.findOneAndUpdate(
        {},
        {
            $set: {
                headerTitle: 'Fresh groceries delivered fast',
                headerSubtitle: 'Daily essentials, fresh produce, dairy, snacks, and household items delivered to your door.',
                searchPlaceholder: 'Search rice, milk, vegetables...',
                categoryTitle: 'Shop by Category',
                exploreTitle: 'All Products',
                showBanners: true,
                showCategories: true,
                showDynamicSections: true,
                showExploreProducts: true,
            },
        },
        { upsert: true, returnDocument: 'after' }
    );

    const categories = await Category.find({}).lean();
    const categoryByName = Object.fromEntries(categories.map(category => [category.name, category._id]));

    const sections = [
        { title: 'Featured Picks', type: 'horizontal', filterType: 'featured', order: 1, isActive: true },
        { title: 'New Arrivals', type: 'horizontal', filterType: 'latest', order: 2, isActive: true },
        {
            title: 'Fresh Fruits & Vegetables',
            type: 'horizontal',
            filterType: 'category',
            categoryId: categoryByName['Fruits & Vegetables'],
            order: 3,
            isActive: true,
        },
        {
            title: 'Daily Essentials',
            type: 'grid',
            filterType: 'category',
            categoryId: categoryByName['Groceries & Essentials'],
            order: 4,
            isActive: true,
        },
    ];

    for (const section of sections) {
        await HomeSection.updateOne({ title: section.title }, { $set: section }, { upsert: true });
    }

    console.log('Home settings and default sections ready');
};

run()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
