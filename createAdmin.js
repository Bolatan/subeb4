const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://bolatan:Ogbogbo123@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const ensureAdminUser = async () => {
  try {
    let adminUser = await User.findOne({ username: 'admin' });

    if (adminUser) {
        console.log('Admin user already exists.');
        // Optional: Update role or password if needed for consistency
        if (adminUser.role !== 'admin') {
            adminUser.role = 'admin';
            await adminUser.save();
            console.log('Admin user role updated to "admin".');
        }
    } else {
      // Create admin user if it doesn't exist
      await User.create({
        username: 'admin',
        password: 'password123',
        role: 'admin',
      });
      console.log('Admin user created successfully.');
    }
  } catch (error) {
    console.error('Error ensuring admin user:', error);
  }
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Successfully connected to MongoDB');
    await ensureAdminUser();
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

run();
