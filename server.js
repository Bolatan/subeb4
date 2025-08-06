const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/audit-app';

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

const SurveyResponse = require('./models/SurveyResponse');

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
