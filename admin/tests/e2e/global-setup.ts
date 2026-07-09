import path from 'node:path';
import { createRequire } from 'node:module';

const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'));

async function retry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, attempt * 1_000));
        }
    }
    throw lastError;
}

export default async function globalSetup() {
    const backendRoot = path.resolve(process.cwd(), '..', 'backend');
    const database = nodeRequire(path.join(backendRoot, 'config', 'database.js'));
    const User = nodeRequire(path.join(backendRoot, 'models', 'User.js'));
    const Category = nodeRequire(path.join(backendRoot, 'models', 'Category.js'));
    const Product = nodeRequire(path.join(backendRoot, 'models', 'Product.js'));
    const StoreSettings = nodeRequire(path.join(backendRoot, 'models', 'StoreSettings.js'));
    const WhatsAppOrder = nodeRequire(path.join(backendRoot, 'models', 'WhatsAppOrder.js'));

    database.assertSafeTestDatabase(process.env.MONGO_TEST_URI);
    await retry(() => database.connectDatabase({ uri: process.env.MONGO_TEST_URI, testMode: true }));
    await User.db.dropDatabase();

    const admin = await User.create({
        name: 'E2E Admin',
        email: 'e2e-admin@gojra.test',
        password: 'E2EAdmin123!',
        role: 'admin',
    });
    await User.create({
        name: 'E2E Customer',
        email: 'e2e-customer@gojra.test',
        password: 'E2ECustomer123!',
        role: 'user',
        phone: '+923001111111',
    });
    const category = await Category.create({
        name: 'E2E Groceries',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    });
    await Product.create({
        name: 'E2E Fresh Milk',
        description: 'Browser test product',
        price: 250,
        stock: 20,
        category: category._id,
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        isFeatured: true,
    });
    await StoreSettings.create({
        storeName: 'Gojra E-Mart Test',
        enableDeliverySlots: false,
    });
    await WhatsAppOrder.create({
        messageId: 'wamid.e2e-seed',
        from: '+923009999999',
        messageBody: 'Please send two milk packs.',
        messageType: 'text',
        status: 'New',
    });

    process.env.E2E_ADMIN_ID = admin._id.toString();
    await database.disconnectDatabase();
}
