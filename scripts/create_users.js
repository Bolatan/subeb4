const mongoose = require('mongoose');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://bolatan:Ogbogbo123@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const temporaryPassword = process.env.DEFAULT_PASSWORD;
const usersFilePath = path.join(__dirname, 'users_to_create.txt');

if (!temporaryPassword) {
    console.error('Error: DEFAULT_PASSWORD environment variable not set.');
    console.error('Please set it before running the script.');
    console.error('Example: DEFAULT_PASSWORD="your_password" node scripts/create_users.js');
    process.exit(1);
}

const createAssessorUsers = async () => {
    try {
        if (!fs.existsSync(usersFilePath)) {
            console.error(`Error: Users file not found at ${usersFilePath}`);
            console.error('Please create this file and add usernames to it, one per line.');
            return;
        }

        const usernames = fs.readFileSync(usersFilePath, 'utf-8').split('\n').filter(Boolean);

        if (usernames.length === 0) {
            console.log('No usernames found in users_to_create.txt. Exiting.');
            return;
        }

        console.log(`Found ${usernames.length} usernames to process.`);

        for (const username of usernames) {
            const trimmedUsername = username.trim();
            if (!trimmedUsername) continue;

            const existingUser = await User.findOne({ username: trimmedUsername });
            if (existingUser) {
                console.log(`User '${trimmedUsername}' already exists. Skipping.`);
                continue;
            }

            await User.create({
                username: trimmedUsername,
                password: temporaryPassword,
                role: 'assessor',
                passwordResetRequired: true,
            });
            console.log(`Assessor user '${trimmedUsername}' created successfully.`);
        }
    } catch (error) {
        console.error('Error creating assessor users:', error);
    }
};

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Successfully connected to MongoDB');
        await createAssessorUsers();
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

run();
