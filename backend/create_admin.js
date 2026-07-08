require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE, ADMIN_ADDRESS, MONGO_URI } = process.env;

    if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error('Missing required env values: MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD');
        process.exit(1);
    }

    if (ADMIN_PASSWORD.length < 10) {
        console.error('ADMIN_PASSWORD must be at least 10 characters.');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const adminExists = await User.findOne({ email: ADMIN_EMAIL });

        if (adminExists) {
            console.log('Admin user already exists');
            process.exit();
        }

        await User.create({
            name: ADMIN_NAME || 'Store Admin',
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            phone: ADMIN_PHONE || '',
            role: 'admin',
            address: ADMIN_ADDRESS || ''
        });

        console.log(`Admin user created successfully: ${ADMIN_EMAIL}`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createAdmin();
