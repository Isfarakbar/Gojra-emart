const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Banner = require('./models/Banner');
const HomeSection = require('./models/HomeSection');

dotenv.config({ path: './.env' }); // Adjusted to current dir

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const seedData = async () => {
    try {
        console.log('Clearing existing data...');
        await Category.deleteMany({});
        await Product.deleteMany({});
        await Banner.deleteMany({});
        await HomeSection.deleteMany({});

        console.log('Creating Categories...');
        const categories = await Category.insertMany([
            { name: 'Groceries & Essentials', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200' },
            { name: 'Dairy & Bakery', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200' },
            { name: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200' },
            { name: 'Meat & Frozen', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200' },
            { name: 'Beverages', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200' },
            { name: 'Snacks & Biscuits', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200' },
            { name: 'Personal Care', image: 'https://images.unsplash.com/photo-1556228720-1957be6a9037?w=200' },
            { name: 'Home & Cleaning', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200' },
            { name: 'Baby Care', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200' },
            { name: 'Health & Wellness', image: 'https://images.unsplash.com/photo-1576091160550-217358c7db81?w=200' },
            { name: 'Electronics', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200' },
            { name: 'Home & Kitchen', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=200' },
            { name: 'Seasonal', image: 'https://images.unsplash.com/photo-1514416432279-50fac261c7dd?w=200' },
        ]);

        console.log('Creating Products...');
        const products = await Product.insertMany([
            {
                name: 'Red Apples (1kg)',
                description: 'Fresh, sweet and crunchy red apples directly from the orchard.',
                price: 250,
                oldPrice: 300,
                stock: 50,
                category: categories[0]._id,
                imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400',
                isFeatured: true
            },
            {
                name: 'Organic Bananas (Dozen)',
                description: 'Rich in potassium, perfectly ripe bananas.',
                price: 120,
                stock: 100,
                category: categories[0]._id,
                imageUrl: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&q=80&w=400',
                isFeatured: false
            },
            {
                name: 'Fresh Broccoli',
                description: 'Green and healthy broccoli, perfect for salads and stir-fry.',
                price: 150,
                oldPrice: 180,
                stock: 30,
                category: categories[1]._id,
                imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bef?auto=format&fit=crop&q=80&w=400',
                isFeatured: true
            },
            {
                name: 'Whole Grain Bread',
                description: 'Freshly baked whole grain bread, high in fiber.',
                price: 180,
                stock: 20,
                category: categories[2]._id,
                imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
                isFeatured: false
            },
            {
                name: 'Farm Fresh Eggs (12)',
                description: 'Free-range eggs, rich in protein.',
                price: 220,
                stock: 60,
                category: categories[3]._id,
                imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&q=80&w=400',
                isFeatured: true
            },
            {
                name: 'Orange Juice 1L',
                description: '100% natural cold pressed orange juice.',
                price: 350,
                oldPrice: 400,
                stock: 40,
                category: categories[4]._id,
                imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400',
                isFeatured: true
            }
        ]);

        console.log('Creating Banners...');
        await Banner.insertMany([
            {
                title: 'Weekend Super Sale',
                subtitle: 'Get Flat 30% OFF on Fruits',
                imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
                linkType: 'category',
                linkId: categories[0]._id, // Link to Fruits
                order: 1
            },
            {
                title: 'Fresh & Organic',
                subtitle: 'Vegetables directly from farm',
                imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800',
                linkType: 'category',
                linkId: categories[1]._id, // Link to Vegetables
                order: 2
            }
        ]);

        console.log('Creating Home Sections...');
        // Find Groceries Category ID
        const groceriesCat = categories.find(c => c.name === 'Groceries & Essentials');

        await HomeSection.insertMany([
            {
                title: 'Featured Products',
                type: 'horizontal',
                filterType: 'featured',
                order: 1
            },
            {
                title: 'Groceries & Essentials',
                type: 'grid', // Requested Grid View
                filterType: 'category',
                categoryId: groceriesCat ? groceriesCat._id : categories[0]._id,
                order: 2
            },
            {
                title: 'Fresh Fruits Collection',
                type: 'horizontal',
                filterType: 'category',
                categoryId: categories[2]._id, // Fruits
                order: 3
            },
        ]);

        console.log('Data Populated Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedData();
