const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-waste-bin');
        console.log('✅ Connected to MongoDB');

        // Check if admin exists
        const adminExists = await User.findOne({ role: 'ADMIN' });

        if (adminExists) {
            console.log('⚠️ Admin account already exists.');
        } else {
            // Create Admin User
            await User.create({
                username: 'admin',
                email: 'admin@example.com',
                password: 'adminpassword123', // Will be hashed by pre-save hook
                role: 'ADMIN',
                firstName: 'System',
                lastName: 'Admin'
            });
            console.log('✅ Admin account created successfully');
            console.log('   Username: admin');
            console.log('   Password: adminpassword123');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedAdmin();
