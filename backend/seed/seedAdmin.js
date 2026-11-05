const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const adminEmail = 'deepak@unfoldinn.com';
    let admin = await Admin.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin already exists:', adminEmail);
      process.exit(0);
    }

    // Check if secondinnings136@gmail.com or old gmail exists, revert to deepak@unfoldinn.com
    const existingAdmin = await Admin.findOne({ email: { $in: ['unfoldinn26@gmail.com', 'secondinnings136@gmail.com', 'deepaksogani18@gmail.com'] } });
    if (existingAdmin) {
      existingAdmin.email = adminEmail;
      await existingAdmin.save();
      console.log(`Reverted admin to: ${adminEmail}`);
      process.exit(0);
    }

    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'SecondInnings@2026';

    admin = new Admin({
      name: 'Deepak Sogani',
      email: adminEmail,
      password: adminPassword,
      role: 'superadmin'
    });

    await admin.save();

    console.log('Superadmin user created successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log('Password has been securely configured.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
