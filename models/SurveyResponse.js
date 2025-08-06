const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
  surveyType: {
    type: String,
    required: true,
    trim: true,
  },
  formData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

module.exports = SurveyResponse;
