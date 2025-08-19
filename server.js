const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const path = require('path');

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
const LoginLog = require('./models/LoginLog');

const jwt = require('jsonwebtoken');

const { validatePassword } = require('./utils/validation');

// --- Demo User Seeding ---
// Deletes and recreates the demo users on every server start to ensure a clean state.
const ensureAdminUser = async () => {
  try {
    // Remove existing demo users
    await User.deleteMany({ username: { $in: ['admin', 'assessor'] } });
    console.log('Removed existing demo users.');

    // Create admin user
    const adminPassword = 'AdminPassword1!';
    const adminPasswordError = validatePassword(adminPassword);
    if (adminPasswordError) {
      console.error('Error seeding admin user:', adminPasswordError);
      return;
    }
    await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'admin',
    });
    console.log('Admin user seeded.');

    // Create assessor user
    const assessorPassword = 'AssessorPassword1!';
    const assessorPasswordError = validatePassword(assessorPassword);
    if (assessorPasswordError) {
        console.error('Error seeding assessor user:', assessorPasswordError);
        return;
    }
    await User.create({
      username: 'assessor',
      password: assessorPassword,
      role: 'assessor',
    });
    console.log('Assessor user seeded.');

    // Ensure bolatan is an admin
    const updateResult = await User.updateOne({ username: 'bolatan' }, { $set: { role: 'admin' } });
    if (updateResult.modifiedCount > 0) {
        console.log('User bolatan role updated to admin.');
    } else if (updateResult.matchedCount > 0) {
        console.log('User bolatan was already an admin.');
    } else {
        console.log('User bolatan not found. No update performed.');
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
      await LoginLog.create({ username, status: 'success' });
      console.log('User found:', user); // DEBUG

      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        imageUrl: user.imageUrl,
        token: generateToken(user._id, user.role),
      });
    } else {
      await LoginLog.create({ username, status: 'failure' });
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Registration endpoint removed as per new requirements.
// User creation is now handled by admins only via /api/users.

// Generic endpoint for all surveys
app.post('/api/surveys/:type', async (req, res) => {
  try {
    const surveyType = req.params.type;
    console.log(`[${new Date().toISOString()}] Received submission for survey type: ${surveyType}`);
    console.log(`[${new Date().toISOString()}] Request Body:`, JSON.stringify(req.body, null, 2));

    // Data might be nested under a 'formData' key. Let's handle that.
    const surveyData = req.body.formData || req.body;
    console.log(`[${new Date().toISOString()}] Parsed survey data:`, JSON.stringify(surveyData, null, 2));

    const survey = new SurveyResponse({
      surveyType: surveyType,
      formData: surveyData,
    });

    console.log(`[${new Date().toISOString()}] Attempting to save survey...`);
    await survey.save();
    console.log(`[${new Date().toISOString()}] Successfully saved survey of type: ${surveyType} with ID: ${survey._id}`);
    res.status(201).json({ message: `${surveyType} survey submitted successfully!`, surveyId: survey._id });
  } catch (error) {
    const surveyType = req.params.type;
    console.error(`[${new Date().toISOString()}] Error saving ${surveyType} survey:`, error);
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
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

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

app.put('/api/users/:id/image', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.imageUrl = req.body.imageUrl;
      await user.save();
      res.json({ message: 'Image updated successfully' });
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
    const fields = ['_id', 'username', 'role', 'createdAt', 'imageUrl'];
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

app.get('/api/logs', protect, async (req, res) => {
  try {
    const logs = await LoginLog.find({}).sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET endpoint for survey reports by type
app.get('/api/reports/:type', protect, async (req, res) => {
  try {
    const surveyType = req.params.type;
    const surveys = await SurveyResponse.find({ surveyType: surveyType }).sort({ createdAt: -1 });
    res.status(200).json(surveys);
  } catch (error) {
    console.error(`Error fetching ${req.params.type} reports:`, error);
    res.status(500).json({ message: 'Failed to fetch reports.', error: error.message });
  }
});

// GET endpoint for aggregated survey reports by type
app.get('/api/reports/:type/summary', protect, async (req, res) => {
  try {
    const surveyType = req.params.type;

    if (surveyType === 'tcmats') {
      const summary = await SurveyResponse.aggregate([
        { $match: { surveyType: 'tcmats' } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            avgPeriodsPerWeek: { $avg: { $convert: { input: "$formData.tcmats_periodsPerWeek", to: "int", onError: 0 } } },
            avgPupilsInClass: { $avg: { $convert: { input: "$formData.tcmats_pupilsInClass", to: "int", onError: 0 } } },
            locations: { $push: "$formData.tcmats_location" },
            institutions: { $push: "$formData.tcmats_institution" },
            qualifications: { $push: "$formData.tcmats_highest_qualification" },
            genders: { $push: "$formData.tcmats_gender" },
            teachingExperiences: { $push: "$formData.tcmats_teaching_experience" },
            classDescriptions: { $push: "$formData.tcmats_class_description" },
            lessonPrep1_yes: { $sum: { $cond: [{ $eq: ["$formData.lesson_prep_1", "yes"] }, 1, 0] } },
            lessonPrep1_no: { $sum: { $cond: [{ $eq: ["$formData.lesson_prep_1", "no"] }, 1, 0] } },
            subjectMastery2_yes: { $sum: { $cond: [{ $eq: ["$formData.subject_mastery_2", "yes"] }, 1, 0] } },
            subjectMastery2_no: { $sum: { $cond: [{ $eq: ["$formData.subject_mastery_2", "no"] }, 1, 0] } },
          }
        },
        {
          $project: {
            _id: 0,
            totalSubmissions: 1,
            avgPeriodsPerWeek: { $round: ["$avgPeriodsPerWeek", 2] },
            avgPupilsInClass: { $round: ["$avgPupilsInClass", 2] },
            locationCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$locations"] }, as: "location", in: { k: "$$location", v: { $size: { $filter: { input: "$locations", cond: { $eq: ["$$this", "$$location"] } } } } } } } },
            institutionCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$institutions"] }, as: "institution", in: { k: "$$institution", v: { $size: { $filter: { input: "$institutions", cond: { $eq: ["$$this", "$$institution"] } } } } } } } },
            qualificationCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$qualifications"] }, as: "qualification", in: { k: "$$qualification", v: { $size: { $filter: { input: "$qualifications", cond: { $eq: ["$$this", "$$qualification"] } } } } } } } },
            genderCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$genders"] }, as: "gender", in: { k: "$$gender", v: { $size: { $filter: { input: "$genders", cond: { $eq: ["$$this", "$$gender"] } } } } } } } },
            teachingExperienceCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$teachingExperiences"] }, as: "experience", in: { k: "$$experience", v: { $size: { $filter: { input: "$teachingExperiences", cond: { $eq: ["$$this", "$$experience"] } } } } } } } },
            classDescriptionCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$classDescriptions"] }, as: "description", in: { k: "$$description", v: { $size: { $filter: { input: "$classDescriptions", cond: { $eq: ["$$this", "$$description"] } } } } } } } },
            lessonPrep1Counts: { yes: "$lessonPrep1_yes", no: "$lessonPrep1_no" },
            subjectMastery2Counts: { yes: "$subjectMastery2_yes", no: "$subjectMastery2_no" },
          }
        }
      ]);

      if (summary.length > 0) {
        res.status(200).json(summary[0]);
      } else {
        res.status(200).json({ totalSubmissions: 0 });
      }
    } else if (surveyType === 'silat_1.1') {
      const summary = await SurveyResponse.aggregate([
        { $match: { surveyType: 'silat_1.1' } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            genders: { $push: "$formData.silnat_a_ht_gender" },
            maritalStatuses: { $push: "$formData.silnat_a_ht_marital_status" },
            qualifications: { $push: "$formData.silnat_a_ht_highest_qualification" },
            experiences: { $push: "$formData.silnat_a_ht_years_experience" },
            discipline_a_yes: { $sum: { $cond: [{ $eq: ["$formData.discipline_a_1.1", "yes"] }, 1, 0] } },
            discipline_a_no: { $sum: { $cond: [{ $eq: ["$formData.discipline_a_1.1", "no"] }, 1, 0] } },
          }
        },
        {
          $project: {
            _id: 0,
            totalSubmissions: 1,
            genderCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$genders"] }, as: "gender", in: { k: "$$gender", v: { $size: { $filter: { input: "$genders", cond: { $eq: ["$$this", "$$gender"] } } } } } } } },
            maritalStatusCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$maritalStatuses"] }, as: "status", in: { k: "$$status", v: { $size: { $filter: { input: "$maritalStatuses", cond: { $eq: ["$$this", "$$status"] } } } } } } } },
            qualificationCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$qualifications"] }, as: "qualification", in: { k: "$$qualification", v: { $size: { $filter: { input: "$qualifications", cond: { $eq: ["$$this", "$$qualification"] } } } } } } } },
            experienceCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$experiences"] }, as: "experience", in: { k: "$$experience", v: { $size: { $filter: { input: "$experiences", cond: { $eq: ["$$this", "$$experience"] } } } } } } } },
            disciplineACounts: { yes: "$discipline_a_yes", no: "$discipline_a_no" },
          }
        }
      ]);

      if (summary.length > 0) {
        res.status(200).json(summary[0]);
      } else {
        res.status(200).json({ totalSubmissions: 0 });
      }
    } else if (surveyType === 'silat_1.2') {
      const summary = await SurveyResponse.aggregate([
        { $match: { surveyType: 'silat_1.2' } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            totalTeachersMale: { $sum: { $convert: { input: "$formData.silat_1_2_teachers_male", to: "int", onError: 0 } } },
            totalTeachersFemale: { $sum: { $convert: { input: "$formData.silat_1_2_teachers_female", to: "int", onError: 0 } } },
            locations: { $push: "$formData.silat_1_2_location" },
            specialLearners: { $push: "$formData.silat_1_2_special_learners" },
          }
        },
        {
          $project: {
            _id: 0,
            totalSubmissions: 1,
            totalTeachers: { $add: ["$totalTeachersMale", "$totalTeachersFemale"] },
            locationCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$locations"] }, as: "location", in: { k: "$$location", v: { $size: { $filter: { input: "$locations", cond: { $eq: ["$$this", "$$location"] } } } } } } } },
            specialLearnersCounts: { $let: {
              vars: {
                allLearners: { $reduce: {
                  input: "$specialLearners",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] }
                }}
              },
              in: { $arrayToObject: { $map: {
                input: { $setUnion: ["$$allLearners"] },
                as: "learnerType",
                in: {
                  k: "$$learnerType",
                  v: { $size: { $filter: { input: "$$allLearners", cond: { $eq: ["$$this", "$$learnerType"] } } } }
                }
              }}}
            }}
          }
        }
      ]);

      if (summary.length > 0) {
        res.status(200).json(summary[0]);
      } else {
        res.status(200).json({ totalSubmissions: 0 });
      }
    } else if (surveyType === 'silat_1.3') {
      const summary = await SurveyResponse.aggregate([
        { $match: { surveyType: 'silat_1.3' } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            totalInstructorsMale: { $sum: { $convert: { input: "$formData.silat13_instructors_male", to: "int", onError: 0 } } },
            totalInstructorsFemale: { $sum: { $convert: { input: "$formData.silat13_instructors_female", to: "int", onError: 0 } } },
            locations: { $push: "$formData.silat13_location" },
            qualifications: { $push: "$formData.highest_qualification_1.3" },
          }
        },
        {
          $project: {
            _id: 0,
            totalSubmissions: 1,
            totalInstructors: { $add: ["$totalInstructorsMale", "$totalInstructorsFemale"] },
            locationCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$locations"] }, as: "location", in: { k: "$$location", v: { $size: { $filter: { input: "$locations", cond: { $eq: ["$$this", "$$location"] } } } } } } } },
            qualificationCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$qualifications"] }, as: "qualification", in: { k: "$$qualification", v: { $size: { $filter: { input: "$qualifications", cond: { $eq: ["$$this", "$$qualification"] } } } } } } } },
          }
        }
      ]);

      if (summary.length > 0) {
        res.status(200).json(summary[0]);
      } else {
        res.status(200).json({ totalSubmissions: 0 });
      }
    } else if (surveyType === 'silat_1.4') {
      const summary = await SurveyResponse.aggregate([
        { $match: { surveyType: 'silat_1.4' } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            totalStaffMale: { $sum: { $convert: { input: "$formData.staff_male_1.4", to: "int", onError: 0 } } },
            totalStaffFemale: { $sum: { $convert: { input: "$formData.staff_female_1.4", to: "int", onError: 0 } } },
            locations: { $push: "$formData.location_1.4" },
            qualifications: { $push: "$formData.highest_qualification_1.4" },
          }
        },
        {
          $project: {
            _id: 0,
            totalSubmissions: 1,
            totalStaff: { $add: ["$totalStaffMale", "$totalStaffFemale"] },
            locationCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$locations"] }, as: "location", in: { k: "$$location", v: { $size: { $filter: { input: "$locations", cond: { $eq: ["$$this", "$$location"] } } } } } } } },
            qualificationCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$qualifications"] }, as: "qualification", in: { k: "$$qualification", v: { $size: { $filter: { input: "$qualifications", cond: { $eq: ["$$this", "$$qualification"] } } } } } } } },
          }
        }
      ]);

      if (summary.length > 0) {
        res.status(200).json(summary[0]);
      } else {
        res.status(200).json({ totalSubmissions: 0 });
      }
    } else if (surveyType === 'lori') {
      const summary = await SurveyResponse.aggregate([
        { $match: { surveyType: 'lori' } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            avgYearsExperience: { $avg: { $convert: { input: "$formData.lori_years_experience", to: "int", onError: 0 } } },
            avgRating_b_1_a: { $avg: { $convert: { input: "$formData.lori_b_1_a", to: "int", onError: 0 } } },
            avgRating_b_1_b: { $avg: { $convert: { input: "$formData.lori_b_1_b", to: "int", onError: 0 } } },
            locations: { $push: "$formData.lori_location" },
            qualifications: { $push: "$formData.lori_qualification" },
          }
        },
        {
          $project: {
            _id: 0,
            totalSubmissions: 1,
            avgYearsExperience: { $round: ["$avgYearsExperience", 2] },
            avgRating_b_1_a: { $round: ["$avgRating_b_1_a", 2] },
            avgRating_b_1_b: { $round: ["$avgRating_b_1_b", 2] },
            locationCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$locations"] }, as: "location", in: { k: "$$location", v: { $size: { $filter: { input: "$locations", cond: { $eq: ["$$this", "$$location"] } } } } } } } },
            qualificationCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$qualifications"] }, as: "qualification", in: { k: "$$qualification", v: { $size: { $filter: { input: "$qualifications", cond: { $eq: ["$$this", "$$qualification"] } } } } } } } },
          }
        }
      ]);

      if (summary.length > 0) {
        res.status(200).json(summary[0]);
      } else {
        res.status(200).json({ totalSubmissions: 0 });
      }
    } else if (surveyType === 'voices') {
      const summary = await SurveyResponse.aggregate([
        { $match: { surveyType: 'voices' } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            avgParticipation1: { $avg: { $convert: { input: "$formData.participation_1", to: "int", onError: 0 } } },
            avgParticipation2: { $avg: { $convert: { input: "$formData.participation_2", to: "int", onError: 0 } } },
            institutions: { $push: "$formData.voices_institution" },
            genders: { $push: "$formData.voices_gender" },
            distances: { $push: "$formData.voices_distance" },
          }
        },
        {
          $project: {
            _id: 0,
            totalSubmissions: 1,
            avgParticipation1: { $round: ["$avgParticipation1", 2] },
            avgParticipation2: { $round: ["$avgParticipation2", 2] },
            institutionCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$institutions"] }, as: "institution", in: { k: "$$institution", v: { $size: { $filter: { input: "$institutions", cond: { $eq: ["$$this", "$$institution"] } } } } } } } },
            genderCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$genders"] }, as: "gender", in: { k: "$$gender", v: { $size: { $filter: { input: "$genders", cond: { $eq: ["$$this", "$$gender"] } } } } } } } },
            distanceCounts: { $arrayToObject: { $map: { input: { $setUnion: ["$distances"] }, as: "distance", in: { k: "$$distance", v: { $size: { $filter: { input: "$distances", cond: { $eq: ["$$this", "$$distance"] } } } } } } } },
          }
        }
      ]);

      if (summary.length > 0) {
        res.status(200).json(summary[0]);
      } else {
        res.status(200).json({ totalSubmissions: 0 });
      }
    } else {
      // Placeholder for other survey types
      res.status(200).json({ message: `Aggregation for ${surveyType} coming soon.` });
    }
  } catch (error) {
    console.error(`Error fetching ${req.params.type} summary:`, error);
    res.status(500).json({ message: 'Failed to fetch summary.', error: error.message });
  }
});

// Serve static files from the 'reports' directory
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Protected routes for serving admin-only HTML pages
app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, 'reports', 'index.html'));
});

// Route for specific report pages
app.get('/reports/:type.html', (req, res) => {
    const surveyType = req.params.type;
    res.sendFile(path.join(__dirname, 'reports', `${surveyType}.html`));
});

app.get('/login_logs', (req, res) => {
  res.sendFile(path.join(__dirname, 'login_logs.html'));
});

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
