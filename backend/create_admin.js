const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = process.env.ADMIN_EMAIL || 'admin@xerox.com';
        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD;

        if (!password) {
            console.error('Error: ADMIN_PASSWORD environment variable is not defined in .env');
            process.exit(1);
        }

        // Check if an admin exists in the database
        let user = await User.findOne({ role: 'admin' });
        if (user) {
            console.log('Admin user already exists. Updating email and password to match env configuration...');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            user.username = username;
            user.email = email;
            await user.save();
            console.log('Admin user updated successfully in database!');
            console.log('Email:', email);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        await user.save();
        console.log('Admin user created successfully');
        console.log('Email:', email);
        console.log('Password: [HIDDEN]');
        process.exit(0);
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
};

createAdmin();
