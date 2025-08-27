const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://bolatan:Ogbogbo123@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const newPassword = 'Avaxhome.ws1$';

const resetAccessorPasswords = async () => {
    try {
        const assessors = await User.find({ role: 'assessor' });

        if (assessors.length === 0) {
            console.log('No users with the "assessor" role found.');
            return;
        }

        console.log(`Found ${assessors.length} assessor(s). Resetting passwords...`);

        for (const assessor of assessors) {
            assessor.password = newPassword;
            assessor.passwordResetRequired = true;
            await assessor.save();
            console.log(`Password for user '${assessor.username}' has been reset.`);
        }

        console.log('Password reset process completed successfully.');

    } catch (error) {
        console.error('Error resetting assessor passwords:', error);
    }
};

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Successfully connected to MongoDB');
        await resetAccessorPasswords();
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

run();
