// backend/create-admin.js
import './config/env.js';
import connectDb from './config/db.js';
import User from './models/user.model.js';
import bcrypt from 'bcryptjs';

async function createAdmin() {
    try {
        await connectDb();
        
        const existingAdmin = await User.findOne({ email: 'admin@vingo.com' });
        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit(0);
        }
        
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        
        const admin = new User({
            fullName: 'Super Admin',
            email: 'admin@vingo.com',
            password: hashedPassword,
            mobile: '03001234567',
            role: 'admin',
            isEmailVerified: true
        });
        
        await admin.save();
        console.log("✅ Admin created successfully!");
        console.log("Email: admin@vingo.com");
        console.log("Password: Admin@123");
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

createAdmin();