import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '..', '.env') });

// Import User model
import User from '../models/User.js';

const createSuperuser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if superuser already exists
    const existingSuperuser = await User.findOne({ role: 'superuser' });
    if (existingSuperuser) {
      console.log('⚠️  Superuser already exists:', existingSuperuser.username);
      process.exit(0);
    }

    // Create superuser
    const superuserData = {
      username: 'admin',
      email: 'admin@guardshare.com',
      password: 'admin123',
      role: 'superuser'
    };

    const superuser = new User(superuserData);
    await superuser.save();
    await superuser.addActivityLog('register', 'Superuser account created via script');

    console.log('🎉 Superuser created successfully!');
    console.log('Username:', superuserData.username);
    console.log('Email:', superuserData.email);
    console.log('Password:', superuserData.password);
    console.log('Role:', superuserData.role);

    // Also create a demo user
    const demoUserData = {
      username: 'demo',
      email: 'demo@guardshare.com',
      password: 'demo123',
      role: 'user'
    };

    const existingDemo = await User.findOne({ username: 'demo' });
    if (!existingDemo) {
      const demoUser = new User(demoUserData);
      await demoUser.save();
      await demoUser.addActivityLog('register', 'Demo user account created via script');
      
      console.log('🎉 Demo user created successfully!');
      console.log('Username:', demoUserData.username);
      console.log('Email:', demoUserData.email);
      console.log('Password:', demoUserData.password);
      console.log('Role:', demoUserData.role);
    }

  } catch (error) {
    console.error('❌ Error creating superuser:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
createSuperuser();