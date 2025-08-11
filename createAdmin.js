const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://bolatan:Ogbogbo123@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const createAdminUser = async (username, password) => {
  try {
    let user = await User.findOne({ username });

    if (user) {
        console.log(`User '${username}' already exists.`);
        if (user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
            console.log(`User '${username}' role updated to "admin".`);
        }
    } else {
      await User.create({
        username,
        password,
        role: 'admin',
      });
      console.log(`Admin user '${username}' created successfully.`);
    }
  } catch (error) {
    console.error(`Error creating admin user '${username}':`, error);
  }
};

const run = async () => {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log('Please provide a username and password.');
    console.log('Usage: node createAdmin.js <username> <password>');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Successfully connected to MongoDB');
    await createAdminUser(username, password);
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

run();
