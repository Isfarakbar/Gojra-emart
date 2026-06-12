require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const adminExists = await User.findOne({ email: 'admin@gmail.com' });

        if (adminExists) {
            console.log('Admin user already exists');
            process.exit();
        }

        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@gmail.com',
            password: '123456', // Will be hashed by pre-save hook
            phone: '1234567890',
            role: 'admin',
            address: 'Admin HQ'
        });

        console.log('Admin user created successfully');
        console.log('Email: admin@gmail.com');
        console.log('Password: 123456');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createAdmin();
