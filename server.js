const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://bolatan:Ogbogbo123@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Successfully connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

const SurveyResponse = require('./models/SurveyResponse');
const User = require('./models/User');

const jwt = require('jsonwebtoken');

// --- Admin User Seeding ---
// Ensure admin user exists with the correct role and password for demo purposes.
const ensureAdminUser = async () => {
  try {
    let adminUser = await User.findOne({ username: 'admin' });

    if (adminUser) {
      let needsUpdate = false;
      // Check if role is not 'admin'
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        needsUpdate = true;
        console.log('Admin user role corrected to "admin".');
      }
      // Check if password is correct
      const passwordIsCorrect = await adminUser.comparePassword('password123');
      if (!passwordIsCorrect) {
        adminUser.password = 'password123';
        needsUpdate = true;
        console.log('Admin user password reset for demo.');
      }
      if (needsUpdate) {
        await adminUser.save();
      }
    } else {
      // Create admin user if it doesn't exist
      await User.create({
        username: 'admin',
        password: 'password123',
        role: 'admin',
      });
      console.log('Admin user created for demo.');
    }

    // Also ensure assessor user for demo
    let assessorUser = await User.findOne({ username: 'assessor' });
    if (!assessorUser) {
        await User.create({
            username: 'assessor',
            password: 'password2025',
            role: 'assessor'
        });
        console.log('Assessor user created for demo.');
    }

  } catch (error) {
    console.error('Error in user seeding script:', error);
  }
};

mongoose.connection.once('open', () => {
    ensureAdminUser();
});


const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'a-very-secret-key', {
    expiresIn: '30d',
  });
};

// User Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Specific endpoints for existing forms to match the frontend calls
app.post('/api/silnat', async (req, res) => {
  try {
    const survey = new SurveyResponse({ surveyType: 'SILNAT', formData: req.body });
    await survey.save();
    res.status(201).json({ message: 'SILNAT survey submitted successfully!' });
  } catch (error) {
    console.error('Error saving SILNAT survey:', error);
    res.status(500).json({ message: 'Submission failed.', error: error.message });
  }
});

app.post('/api/tcmats', async (req, res) => {
  try {
    const survey = new SurveyResponse({ surveyType: 'TCMATS', formData: req.body });
    await survey.save();
    res.status(201).json({ message: 'TCMATS survey submitted successfully!' });
  } catch (error) {
    console.error('Error saving TCMATS survey:', error);
    res.status(500).json({ message: 'Submission failed.', error: error.message });
  }
});

app.post('/api/lori', async (req, res) => {
  try {
    const survey = new SurveyResponse({ surveyType: 'LORI', formData: req.body });
    await survey.save();
    res.status(201).json({ message: 'LORI survey submitted successfully!' });
  } catch (error) {
    console.error('Error saving LORI survey:', error);
    res.status(500).json({ message: 'Submission failed.', error: error.message });
  }
});

app.post('/api/voices', async (req, res) => {
  try {
    const survey = new SurveyResponse({ surveyType: 'VOICES', formData: req.body });
    await survey.save();
    res.status(201).json({ message: 'VOICES survey submitted successfully!' });
  } catch (error) {
    console.error('Error saving VOICES survey:', error);
    res.status(500).json({ message: 'Submission failed.', error: error.message });
  }
});

// Generic endpoint for other/new surveys
app.post('/api/surveys/:type', async (req, res) => {
  try {
    const survey = new SurveyResponse({
      surveyType: req.params.type,
      formData: req.body,
    });
    await survey.save();
    res.status(201).json({ message: `${req.params.type} survey submitted successfully!` });
  } catch (error) {
    console.error(`Error saving ${req.params.type} survey:`, error);
    res.status(500).json({ message: 'Submission failed.', error: error.message });
  }
});

// Middleware for authentication
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'a-very-secret-key');
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware for admin authorization
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

// User Management routes
app.post('/api/users', protect, admin, async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users', protect, admin, async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

app.delete('/api/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET endpoint to retrieve all survey data for reports
app.get('/api/reports', async (req, res) => {
  try {
    const surveys = await SurveyResponse.find({}).sort({ createdAt: -1 });
    res.status(200).json(surveys);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports.', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
