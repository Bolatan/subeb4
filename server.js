const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');

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

// --- Demo User Seeding ---
// Deletes and recreates the demo users on every server start to ensure a clean state.
const ensureAdminUser = async () => {
  try {
    // Remove existing demo users
    await User.deleteMany({ username: { $in: ['admin', 'assessor'] } });
    console.log('Removed existing demo users.');

    // Create admin user
    await User.create({
      username: 'admin',
      password: 'password123',
      role: 'admin',
    });
    console.log('Admin user seeded.');

    // Create assessor user
    await User.create({
      username: 'assessor',
      password: 'password2025',
      role: 'assessor',
    });
    console.log('Assessor user seeded.');

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
      console.log('User found:', user); // DEBUG

      if (user.username === 'admin' && user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
        console.log('Admin user role forcefully corrected during login.');
      }

      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        imageUrl: user.imageUrl,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Registration endpoint removed as per new requirements.
// User creation is now handled by admins only via /api/users.

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
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'a-very-secret-key');
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
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
  const { username, password, role, imageUrl } = req.body;

  try {
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      password,
      role,
      imageUrl,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        imageUrl: user.imageUrl,
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

app.put('/api/users/:id/password', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.password = req.body.password;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users/export', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').lean();
    const fields = ['_id', 'username', 'role', 'createdAt'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(users);
    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    res.send(csv);
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
