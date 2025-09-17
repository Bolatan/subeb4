const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
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

// Add a compound index for surveyType and createdAt to optimize report queries
surveyResponseSchema.index({ surveyType: 1, createdAt: -1 });

const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

module.exports = SurveyResponse;
