require('dotenv').config();

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const categoryImages = {
    'Groceries & Essentials': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
    'Fruits & Vegetables': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800',
    'Dairy & Bakery': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800',
    'Meat & Frozen': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800',
    'Beverages': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800',
    'Snacks & Biscuits': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800',
    'Personal Care': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800',
    'Home & Cleaning': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800',
};

const products = [
    {
        name: 'Super Kernel Basmati Rice 5kg',
        category: 'Groceries & Essentials',
        price: 1890,
        oldPrice: 2050,
        imageUrl: 'https://loremflickr.com/900/700/basmati-rice',
        description: 'Premium long-grain Super Kernel basmati rice with a naturally aromatic fragrance and fluffy cooked texture. Ideal for biryani, pulao, fried rice, and daily family meals. Carefully packed to help preserve freshness and grain quality.',
        variants: [
            { unit: '1kg', price: 390, stock: 100 },
            { unit: '5kg', price: 1890, stock: 100, oldPrice: 2050 },
        ],
        isFeatured: true,
    },
    {
        name: 'Chakki Fresh Atta 10kg',
        category: 'Groceries & Essentials',
        price: 1580,
        oldPrice: 1690,
        imageUrl: 'https://loremflickr.com/900/700/whole-wheat-flour',
        description: 'Stone-ground wheat flour made for soft rotis, parathas, and everyday home cooking. Balanced texture, natural wheat taste, and reliable dough consistency for Pakistani kitchens.',
        variants: [
            { unit: '5kg', price: 820, stock: 100 },
            { unit: '10kg', price: 1580, stock: 100, oldPrice: 1690 },
        ],
    },
    {
        name: 'Pure Cooking Oil 3L',
        category: 'Groceries & Essentials',
        price: 1820,
        imageUrl: 'https://loremflickr.com/900/700/cooking-oil',
        description: 'Light, refined cooking oil suitable for frying, sauteing, and everyday meal preparation. Neutral taste keeps the natural flavor of your food intact while delivering dependable cooking performance.',
        variants: [
            { unit: '1L', price: 625, stock: 100 },
            { unit: '3L', price: 1820, stock: 100 },
        ],
    },
    {
        name: 'White Sugar 1kg',
        category: 'Groceries & Essentials',
        price: 175,
        imageUrl: 'https://loremflickr.com/900/700/white-sugar',
        description: 'Fine white sugar for tea, desserts, baking, and everyday sweetening. Clean packed crystals with consistent sweetness and easy storage for daily household use.',
        variants: [
            { unit: '1kg', price: 175, stock: 100 },
            { unit: '5kg', price: 850, stock: 100 },
        ],
    },
    {
        name: 'Masoor Dal 1kg',
        category: 'Groceries & Essentials',
        price: 360,
        imageUrl: 'https://loremflickr.com/900/700/red-lentils',
        description: 'Clean red lentils that cook quickly into soft, flavorful dal. A protein-rich pantry essential for soups, curries, and simple comfort meals.',
        variants: [
            { unit: '500g', price: 185, stock: 100 },
            { unit: '1kg', price: 360, stock: 100 },
        ],
    },
    {
        name: 'Kala Chana 1kg',
        category: 'Groceries & Essentials',
        price: 340,
        imageUrl: 'https://loremflickr.com/900/700/black-chickpeas',
        description: 'Nutritious black chickpeas with firm texture and earthy flavor. Perfect for chana chaat, salan, breakfast bowls, and high-protein family meals.',
        variants: [
            { unit: '500g', price: 175, stock: 100 },
            { unit: '1kg', price: 340, stock: 100 },
        ],
    },
    {
        name: 'Red Chili Powder 200g',
        category: 'Groceries & Essentials',
        price: 210,
        imageUrl: 'https://loremflickr.com/900/700/red-chili-powder',
        description: 'Bright, finely ground red chili powder for curries, marinades, BBQ spice mixes, and traditional Pakistani cooking. Adds heat, color, and deep flavor.',
        variants: [
            { unit: '100g', price: 115, stock: 100 },
            { unit: '200g', price: 210, stock: 100 },
        ],
    },
    {
        name: 'Fresh Tomatoes 1kg',
        category: 'Fruits & Vegetables',
        price: 180,
        imageUrl: 'https://loremflickr.com/900/700/fresh-tomatoes',
        description: 'Fresh red tomatoes selected for everyday cooking, salads, sauces, and gravies. Juicy texture with balanced tanginess for home-style meals.',
        variants: [
            { unit: '500g', price: 95, stock: 100 },
            { unit: '1kg', price: 180, stock: 100 },
        ],
        isFeatured: true,
    },
    {
        name: 'Red Onions 1kg',
        category: 'Fruits & Vegetables',
        price: 150,
        imageUrl: 'https://loremflickr.com/900/700/red-onions',
        description: 'Fresh red onions with firm bulbs and strong flavor. Essential for cooking bases, salads, chutneys, barbecue sides, and daily meal preparation.',
        variants: [
            { unit: '1kg', price: 150, stock: 100 },
            { unit: '3kg', price: 430, stock: 100 },
        ],
    },
    {
        name: 'Potatoes 2kg',
        category: 'Fruits & Vegetables',
        price: 240,
        imageUrl: 'https://loremflickr.com/900/700/potatoes',
        description: 'All-purpose potatoes suitable for fries, curries, mashed potatoes, snacks, and breakfast dishes. Carefully selected for firm texture and daily use.',
        variants: [
            { unit: '1kg', price: 125, stock: 100 },
            { unit: '2kg', price: 240, stock: 100 },
        ],
    },
    {
        name: 'Fresh Carrots 1kg',
        category: 'Fruits & Vegetables',
        price: 160,
        imageUrl: 'https://loremflickr.com/900/700/fresh-carrots',
        description: 'Crunchy fresh carrots for salads, soups, juices, mixed vegetables, and gajar ka halwa. Naturally sweet and packed for freshness.',
        variants: [
            { unit: '500g', price: 85, stock: 100 },
            { unit: '1kg', price: 160, stock: 100 },
        ],
    },
    {
        name: 'Cucumbers 1kg',
        category: 'Fruits & Vegetables',
        price: 140,
        imageUrl: 'https://loremflickr.com/900/700/cucumbers',
        description: 'Cool, crisp cucumbers for salads, raita, sandwiches, detox drinks, and side servings. Freshly selected for firmness and clean taste.',
        variants: [
            { unit: '500g', price: 75, stock: 100 },
            { unit: '1kg', price: 140, stock: 100 },
        ],
    },
    {
        name: 'Fresh Green Coriander Bunch',
        category: 'Fruits & Vegetables',
        price: 45,
        imageUrl: 'https://loremflickr.com/900/700/fresh-coriander',
        description: 'Aromatic green coriander bunch for garnishing, chutneys, salads, and curries. Adds fresh fragrance and color to finished dishes.',
        variants: [
            { unit: '1 bunch', price: 45, stock: 100 },
            { unit: '2 bunches', price: 85, stock: 100 },
        ],
    },
    {
        name: 'Fresh Milk 1L',
        category: 'Dairy & Bakery',
        price: 230,
        imageUrl: 'https://loremflickr.com/900/700/fresh-milk',
        description: 'Fresh dairy milk for tea, cereal, desserts, smoothies, and daily household use. Delivered chilled where possible and packed for freshness.',
        variants: [
            { unit: '500ml', price: 120, stock: 100 },
            { unit: '1L', price: 230, stock: 100 },
        ],
        isFeatured: true,
    },
    {
        name: 'Plain Yogurt 1kg',
        category: 'Dairy & Bakery',
        price: 260,
        imageUrl: 'https://loremflickr.com/900/700/plain-yogurt',
        description: 'Smooth plain yogurt for raita, lassi, marinades, breakfast bowls, and everyday meals. Fresh taste with creamy consistency.',
        variants: [
            { unit: '500g', price: 140, stock: 100 },
            { unit: '1kg', price: 260, stock: 100 },
        ],
    },
    {
        name: 'Cheddar Cheese Slices 200g',
        category: 'Dairy & Bakery',
        price: 520,
        imageUrl: 'https://loremflickr.com/900/700/cheddar-cheese-slices',
        description: 'Creamy cheddar cheese slices for burgers, sandwiches, omelets, wraps, and lunch boxes. Easy to melt and portion for quick meals.',
        variants: [
            { unit: '10 slices', price: 520, stock: 100 },
        ],
    },
    {
        name: 'Brown Bread Loaf',
        category: 'Dairy & Bakery',
        price: 210,
        imageUrl: 'https://loremflickr.com/900/700/brown-bread-loaf',
        description: 'Soft brown bread loaf for sandwiches, toast, breakfast, and snacks. Made for everyday freshness with a light whole-wheat taste.',
        variants: [
            { unit: '1 loaf', price: 210, stock: 100 },
        ],
    },
    {
        name: 'Eggs Farm Fresh Dozen',
        category: 'Dairy & Bakery',
        price: 360,
        imageUrl: 'https://loremflickr.com/900/700/farm-eggs',
        description: 'Farm fresh eggs for breakfast, baking, curries, and protein-rich meals. Carefully packed to reduce breakage during delivery.',
        variants: [
            { unit: '6 pcs', price: 185, stock: 100 },
            { unit: '12 pcs', price: 360, stock: 100 },
        ],
    },
    {
        name: 'Chicken Breast Boneless 1kg',
        category: 'Meat & Frozen',
        price: 1180,
        imageUrl: 'https://loremflickr.com/900/700/boneless-chicken-breast',
        description: 'Clean boneless chicken breast suitable for grilling, curries, sandwiches, pasta, diet meals, and meal prep. Hygienically packed for freshness.',
        variants: [
            { unit: '500g', price: 610, stock: 100 },
            { unit: '1kg', price: 1180, stock: 100 },
        ],
        isFeatured: true,
    },
    {
        name: 'Chicken Nuggets 500g',
        category: 'Meat & Frozen',
        price: 690,
        imageUrl: 'https://loremflickr.com/900/700/chicken-nuggets',
        description: 'Frozen chicken nuggets with crispy coating and tender filling. Quick snack or lunchbox option ready for frying, baking, or air frying.',
        variants: [
            { unit: '500g', price: 690, stock: 100 },
            { unit: '1kg', price: 1320, stock: 100 },
        ],
    },
    {
        name: 'Frozen Paratha Pack 20pcs',
        category: 'Meat & Frozen',
        price: 540,
        imageUrl: 'https://loremflickr.com/900/700/frozen-paratha',
        description: 'Ready-to-cook frozen parathas for quick breakfasts and dinners. Flaky texture, convenient portions, and easy pan preparation from frozen.',
        variants: [
            { unit: '10 pcs', price: 290, stock: 100 },
            { unit: '20 pcs', price: 540, stock: 100 },
        ],
    },
    {
        name: 'Mineral Water 1.5L',
        category: 'Beverages',
        price: 120,
        imageUrl: 'https://loremflickr.com/900/700/mineral-water-bottle',
        description: 'Clean bottled mineral water for home, office, travel, and daily hydration. Sealed bottle with fresh taste and convenient family-size volume.',
        variants: [
            { unit: '1.5L', price: 120, stock: 100 },
            { unit: '6 bottles', price: 690, stock: 100 },
        ],
    },
    {
        name: 'Cola Soft Drink 1.5L',
        category: 'Beverages',
        price: 220,
        imageUrl: 'https://loremflickr.com/900/700/cola-bottle',
        description: 'Refreshing cola soft drink for meals, parties, guests, and weekend snacks. Best served chilled for crisp fizz and bold taste.',
        variants: [
            { unit: '500ml', price: 95, stock: 100 },
            { unit: '1.5L', price: 220, stock: 100 },
        ],
    },
    {
        name: 'Green Tea Bags 50pcs',
        category: 'Beverages',
        price: 450,
        imageUrl: 'https://loremflickr.com/900/700/green-tea-bags',
        description: 'Light and soothing green tea bags for daily wellness routines. Convenient individually portioned bags for quick brewing at home or work.',
        variants: [
            { unit: '25 pcs', price: 240, stock: 100 },
            { unit: '50 pcs', price: 450, stock: 100 },
        ],
    },
    {
        name: 'Potato Chips Masala 150g',
        category: 'Snacks & Biscuits',
        price: 180,
        imageUrl: 'https://loremflickr.com/900/700/potato-chips',
        description: 'Crunchy potato chips with spicy masala seasoning. Perfect for movie nights, school snacks, tea time, and sharing with family.',
        variants: [
            { unit: '75g', price: 95, stock: 100 },
            { unit: '150g', price: 180, stock: 100 },
        ],
    },
    {
        name: 'Chocolate Cookies 250g',
        category: 'Snacks & Biscuits',
        price: 290,
        imageUrl: 'https://loremflickr.com/900/700/chocolate-cookies',
        description: 'Chocolate cookies with a rich cocoa taste and crisp bite. A sweet snack for tea, lunch boxes, guests, and late-night cravings.',
        variants: [
            { unit: '125g', price: 155, stock: 100 },
            { unit: '250g', price: 290, stock: 100 },
        ],
    },
    {
        name: 'Nimko Mix 400g',
        category: 'Snacks & Biscuits',
        price: 360,
        imageUrl: 'https://loremflickr.com/900/700/savory-snack-mix',
        description: 'Crispy savory nimko mix with balanced spice, crunch, and traditional snack flavor. Great for tea time, guests, travel, and family gatherings.',
        variants: [
            { unit: '200g', price: 190, stock: 100 },
            { unit: '400g', price: 360, stock: 100 },
        ],
    },
    {
        name: 'Laundry Detergent Powder 1kg',
        category: 'Home & Cleaning',
        price: 480,
        imageUrl: 'https://loremflickr.com/900/700/laundry-detergent',
        description: 'Powerful detergent powder for everyday laundry, stain removal, and fresh-smelling clothes. Suitable for hand wash and machine wash routines.',
        variants: [
            { unit: '500g', price: 250, stock: 100 },
            { unit: '1kg', price: 480, stock: 100 },
        ],
    },
    {
        name: 'Dishwashing Liquid Lemon 500ml',
        category: 'Home & Cleaning',
        price: 260,
        imageUrl: 'https://loremflickr.com/900/700/dishwashing-liquid',
        description: 'Lemon-scent dishwashing liquid that cuts grease from plates, pots, pans, and utensils. Gentle on hands while leaving dishes clean and fresh.',
        variants: [
            { unit: '500ml', price: 260, stock: 100 },
            { unit: '1L', price: 495, stock: 100 },
        ],
    },
    {
        name: 'Floor Cleaner Floral 1L',
        category: 'Home & Cleaning',
        price: 390,
        imageUrl: 'https://loremflickr.com/900/700/floor-cleaner',
        description: 'Floral floor cleaner for tiles, marble, and everyday home surfaces. Helps remove dirt and leaves rooms smelling fresh after cleaning.',
        variants: [
            { unit: '1L', price: 390, stock: 100 },
        ],
    },
    {
        name: 'Herbal Shampoo 400ml',
        category: 'Personal Care',
        price: 620,
        imageUrl: 'https://loremflickr.com/900/700/herbal-shampoo',
        description: 'Herbal shampoo for daily hair cleansing with a fresh fragrance and smooth lather. Helps remove oil and dirt while keeping hair manageable.',
        variants: [
            { unit: '200ml', price: 340, stock: 100 },
            { unit: '400ml', price: 620, stock: 100 },
        ],
    },
    {
        name: 'Toothpaste Fresh Mint 150g',
        category: 'Personal Care',
        price: 280,
        imageUrl: 'https://loremflickr.com/900/700/toothpaste',
        description: 'Fresh mint toothpaste for daily brushing, clean breath, and oral hygiene. Family-size tube for morning and night use.',
        variants: [
            { unit: '75g', price: 155, stock: 100 },
            { unit: '150g', price: 280, stock: 100 },
        ],
    },
];

const run = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is required.');
    }

    await mongoose.connect(process.env.MONGO_URI);

    const categoryDocs = {};
    for (const [name, image] of Object.entries(categoryImages)) {
        const category = await Category.findOneAndUpdate(
            { name },
            { $setOnInsert: { name, image } },
            { returnDocument: 'after', upsert: true }
        );
        categoryDocs[name] = category;
    }

    let inserted = 0;
    let updated = 0;

    for (const product of products) {
        const category = categoryDocs[product.category];
        if (!category) {
            throw new Error(`Missing category: ${product.category}`);
        }

        const result = await Product.updateOne(
            { name: product.name },
            {
                $set: {
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    oldPrice: product.oldPrice,
                    stock: 100,
                    category: category._id,
                    imageUrl: product.imageUrl,
                    isFeatured: product.isFeatured === true,
                    isActive: true,
                    variants: product.variants.map(variant => ({
                        ...variant,
                        stock: 100,
                    })),
                },
            },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            inserted += 1;
        } else {
            updated += 1;
        }
    }

    console.log(`Seed complete. Inserted: ${inserted}, updated: ${updated}, total seeded: ${products.length}`);
};

run()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
