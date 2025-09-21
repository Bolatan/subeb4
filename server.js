const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const path = require('path');
const XLSX = require('xlsx');

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

const bcrypt = require('bcryptjs');

// --- Demo User Seeding ---
// Upserts demo users on server start to ensure they exist.
const ensureAdminUser = async () => {
  try {
    // Upsert admin user
    const adminPassword = 'AdminPassword1!';
    const adminPasswordError = validatePassword(adminPassword);
    if (adminPasswordError) {
      console.error('Error seeding admin user:', adminPasswordError);
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    await User.updateOne(
      { username: 'admin' },
      { $set: { username: 'admin', password: hashedPassword, role: 'admin' } },
      { upsert: true }
    );
    console.log('Admin user ensured.');

    // Upsert assessor user
    const assessorPassword = 'AssessorPassword1!';
    const assessorPasswordError = validatePassword(assessorPassword);
    if (assessorPasswordError) {
        console.error('Error seeding assessor user:', assessorPasswordError);
        return;
    }
    const hashedAssessorPassword = await bcrypt.hash(assessorPassword, salt);
    await User.updateOne(
      { username: 'assessor' },
      { $set: { username: 'assessor', password: hashedAssessorPassword, role: 'assessor' } },
      { upsert: true }
    );
    console.log('Assessor user ensured.');
  } catch (error) {
    console.error('Error in user seeding script:', error);
  }
};

mongoose.connection.once('open', () => {
    ensureAdminUser();
});


const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'a-very-secret-key', {
    expiresIn: '5h',
  });
};

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
        passwordResetRequired: user.passwordResetRequired,
      });
    } else {
      await LoginLog.create({ username, status: 'failure' });
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/user/password', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const passwordError = validatePassword(req.body.password);
      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }
      user.password = req.body.password;
      user.passwordResetRequired = false;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Registration endpoint removed as per new requirements.
// User creation is now handled by admins only via /api/users.

// Generic endpoint for all surveys
app.post('/api/surveys/:type', protect, async (req, res) => {
  try {
    let surveyType = req.params.type;
    // Sanitize surveyType to remove newlines
    if (surveyType) {
      surveyType = surveyType.replace(/(\r\n|\n|\r)/gm, "");
    }
    console.log(`[${new Date().toISOString()}] Received submission for survey type: ${surveyType}`);
    console.log(`[${new Date().toISOString()}] Request Body:`, JSON.stringify(req.body, null, 2));

    // Data might be nested under a 'formData' key. Let's handle that.
    const surveyData = req.body.formData || req.body;
    console.log(`[${new Date().toISOString()}] Parsed survey data:`, JSON.stringify(surveyData, null, 2));

    // Automation for SILAT 1.2 Teacher/Pupil Ratio
    if (surveyType === 'silat_1.2') {
      const teachers = parseInt(surveyData.silat_1_2_teachers_total, 10);
      const pupils = parseInt(surveyData.silat_1_2_learners_total, 10);
      if (teachers > 0 && pupils > 0) {
        const ratio = Math.round(pupils / teachers);
        surveyData.silat_1_2_teacher_pupil_ratio = `1:${ratio}`;
      } else {
        surveyData.silat_1_2_teacher_pupil_ratio = 'N/A';
      }
    }

    const survey = new SurveyResponse({
      user: req.user._id,
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
      passwordResetRequired: role === 'assessor',
    });

    if (user) {
      res.status(201).json({
        message: `User '${user.username}' created successfully`,
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    try {
        const query = {};
        if (searchTerm) {
            query.username = { $regex: searchTerm, $options: 'i' };
        }

        const usersPromise = User.find(query)
            .select('-password -imageUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsersPromise = User.countDocuments(query);

        const [users, totalUsers] = await Promise.all([usersPromise, totalUsersPromise]);

        res.json({
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/users/:id/image', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('imageUrl');
        if (user) {
            res.json({ imageUrl: user.imageUrl });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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
    // Process users to handle data:image in imageUrl
    const processedUsers = users.map(user => {
      if (user.imageUrl && user.imageUrl.startsWith('data:image')) {
        // Replace base64 image data with a placeholder
        return { ...user, imageUrl: '[Embedded Image]' };
      }
      return user;
    });

    const fields = ['_id', 'username', 'role', 'createdAt', 'imageUrl'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(processedUsers);
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

// GET endpoint for all survey reports
app.get('/api/reports/all', protect, async (req, res) => {
  try {
    const surveys = await SurveyResponse.find({}).populate('user', 'username').sort({ createdAt: -1 });
    res.status(200).json(surveys);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports.', error: error.message });
  }
});

// --- Helper function for flattening survey data ---
const flattenSubmissions = (submissions) => {
  const flatData = [];
  const allKeys = new Set();

  // First, get all unique keys from all formData objects
  submissions.forEach(sub => {
    if (sub.formData) {
      Object.keys(sub.formData).forEach(key => allKeys.add(key));
    }
  });
  const sortedKeys = Array.from(allKeys).sort();

  // Now, create the flattened data
  submissions.forEach(sub => {
    const flatRow = {
      'Username': sub.user ? sub.user.username : 'N/A',
      'Survey Type': sub.surveyType,
      'Submission Date': new Date(sub.createdAt).toLocaleString(),
    };

    sortedKeys.forEach(key => {
      if (sub.formData && sub.formData[key] !== undefined) {
        const value = sub.formData[key];
        flatRow[key] = Array.isArray(value) ? value.join(', ') : value;
      } else {
        flatRow[key] = ''; // Use empty string for missing values
      }
    });
    flatData.push(flatRow);
  });

  return flatData;
};


// --- Server-side Export Endpoints ---

// Export to Excel
app.get('/api/export/excel', protect, async (req, res) => {
  try {
    const submissions = await SurveyResponse.find({}).populate('user', 'username').lean();
    if (submissions.length === 0) {
      return res.status(404).send('No data to export.');
    }

    const flatData = flattenSubmissions(submissions);
    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Disposition', 'attachment; filename="SurveySubmissions.xlsx"');
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).send('Error exporting to Excel');
  }
});

const { Transform } = require('stream');

// Helper to flatten nested objects for CSV export
const flattenObjectForCsv = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        const key = pre + k;
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObjectForCsv(obj[k], key));
        } else {
            acc[key] = Array.isArray(obj[k]) ? obj[k].join('; ') : obj[k];
        }
        return acc;
    }, {});
};

const surveyLabelMaps = {
    "silat_1.1": {
        "silnat_a_ht_name": "Head Teacher/Manager Name",
        "silnat_a_ht_contact": "Contact Number",
        "silnat_a_ht_gender_1_1": "Gender",
        "silnat_a_ht_marital_status_1_1": "Marital Status",
        "silnat_a_ht_highest_qualification": "Highest Qualification",
        "silnat_a_ht_highest_qualification_other": "Other Qualification",
        "silnat_a_ht_years_experience": "Years of Leadership Experience",
        "silnat_a_institution_type": "Institution Type",
        "localGov": "Local Govt Educ Auth",
        "schoolName": "Name of School/Institution",
        "schoolAddress": "Address of School/Institution",
        "silnat_location_common": "Location",
        "latitude": "Latitude",
        "longitude": "Longitude",
        "silnat_assemblyDevotion_startTime": "Assembly Devotion Start Time",
        "silnat_assemblyDevotion_endTime": "Assembly Devotion End Time",
        "silnat_teachers_male": "Number of Teachers (Male)",
        "silnat_teachers_female": "Number of Teachers (Female)",
        "silnat_teachers_total": "Total Number of Teachers",
        "silnat_non_teaching_male": "Number of Non-Teaching Staff (Male)",
        "silnat_non_teaching_female": "Number of Non-Teaching Staff (Female)",
        "silnat_non_teaching_total": "Total Number of Non-Teaching Staff",
        "silnat_pupils_eccde_male": "Number of Pupils in ECCDE",
        "silnat_pupils_eccde_female": "Number of Pupils in ECCDE",
        "silnat_pupils_eccde_total": "ECCDE: *",
        "silnat_pupils_primary_male": "Number of Pupils in Primary",
        "silnat_pupils_primary_female": "Number of Pupils in Primary",
        "silnat_pupils_primary_total": "Primary: *",
        "silnat_pupils_special_male": "Number of Special Learners",
        "silnat_pupils_special_female": "Number of Special Learners",
        "silnat_pupils_special_total": "Special Learners: accordingly;",
        "silnat_pupils_male": "Total Male Pupils",
        "silnat_pupils_female": "Total Female Pupils",
        "silnat_pupils_total": "Grand Total Pupils",
        "silnat_teacher_pupil_ratio": "Teacher/Pupils Ratio",
        "silnat_additional_staff_required": "Number of Additional Teachers/Staff Required",
        "silnat_multigrade_classes": "Number of Classes operated as Multigrade",
        "silnat_multigrade_reasons": "Reason(s) for operating Multigrade classes",
        "discipline_a_1.1": "Getting Teachers and Learners to obey rules and regulations",
        "discipline_b_1.1": "Handling of disciplinary cases on time and appropriately",
        "discipline_c_1.1": "Effecting discipline of misconduct in the School",
        "discipline_d_1.1": "Handling cases of lateness, truancy, etc. in the School",
        "discipline_e_1.1": "Handling cases of professional misconduct by teachers School",
        "cooperation_a_1.1": "Assigning administrative responsibilities in the school to teachers",
        "cooperation_b_1.1": "Delegating of duties to subordinates",
        "cooperation_c_1.1": "Getting Teachers to work cooperatively to carry out assigned duties",
        "cooperation_d_1.1": "Encouraging team work in the School",
        "communication_a_1.1": "Establishing effective channel of communication in the School",
        "communication_b_1.1": "Guaranteeing freedom of expression in the School",
        "communication_c_1.1": "Encouraging good communication skills among staff and learners",
        "community_a_1.1": "Getting the communities to be committed to the school activities",
        "community_b_1.1": "Getting Teachers to relate well with the School community",
        "community_c_1.1": "Institutionalizing SBMC in the School",
        "community_d_1.1": "Getting SBMC actively involved in the management and provision of facilities in the school",
        "community_e_1.1": "Involving former pupils in the School activities",
        "supervision_a_1.1": "Assessing Teachers’ lesson plan before delivery",
        "supervision_b_1.1": "Getting Teachers supevised during lesson presentations",
        "supervision_c_1.1": "Monitoring tests and assignments in the School",
        "supervision_d_1.1": "Monitoring of class attendances of teachers and learners",
        "supervision_e_1.1": "Supervision of co-curricular activities in the School",
        "records_a_1.1": "Maintaining the School Log Book",
        "records_b_1.1": "Maintenance of daily classroom register by teachers",
        "records_c_1.1": "Maintaining Weekly Diaries",
        "records_d_1.1": "Maintenance of Teachers' Movement Book",
        "records_e_1.1": "Keeping of Teachers' Time-book",
        "records_f_1.1": "Keeping of Admission Register",
        "records_g_1.1": "Keeping of Minutes of Staff meetings",
        "records_h_1.1": "Keeping of Examination Records",
        "records_i_1.1": "Keeping of Visitors Book",
        "health_a_1.1": "Keeping the school compound clean",
        "health_b_1.1": "Keeping and stocking of First Aid box",
        "health_c_1.1": "Getting the pupils obey hygienic rules",
        "health_d_1.1": "Getting medical services for the pupils",
        "health_e_1.1": "Hand Washing Station",
        "health_f_1.1": "Waste Disposal Bin",
        "signboard_1_1": "Signboard",
        "teachers_furniture_available": "Teachers’ Furniture (Number Available)",
        "teachers_furniture_good": "Teachers’ Furniture (Number in Good Condition)",
        "teachers_furniture_required": "Teachers’ Furniture (Additional Number Required)",
        "eccde_furniture_available": "ECCDE Furniture (Number Available)",
        "eccde_furniture_good": "ECCDE Furniture (Number in Good Condition)",
        "eccde_furniture_required": "ECCDE Furniture (Additional Number Required)",
        "primary_furniture_available": "Primary Furniture (Number Available)",
        "primary_furniture_good": "Primary Furniture (Number in Good Condition)",
        "primary_furniture_required": "Primary Furniture (Additional Number Required)",
        "classroom_available": "Classrooms (Number Available)",
        "classroom_good": "Classrooms (Number in Good Condition)",
        "classroom_minor_repair": "Classrooms (Number in need of Minor Repair)",
        "classroom_major_repair": "Classrooms (Number in need of Major Repair/Renovation)",
        "classroom_required": "Number of Additional Classroom Required",
        "classroom_repair_description": "Brief description of repair needed for classrooms",
        "shared_facility_1_1": "Is the school located within a school Complex?",
        "shared_facility_schools": "Other Schools within the Complex",
        "perimeter_fence_1_1": "Does the school have a perimeter fence?",
        "fence_condition_1_1": "State of the perimeter fence",
        "fence_repair_description": "Brief description of repair needed for fence",
        "school_perimeter": "Perimeter of the School (if no fence)",
        "toilet_type_1_1": "Type of Toilet",
        "toilet_cubicle_available": "Number of Cubicle Toilets Available",
        "toilet_minor_repair": "Toilets in need of Minor Repair",
        "toilet_major_repair": "Toilets in need of Major Repair",
        "toilet_renovation_required": "Toilets Renovation Required",
        "toilet_additional_required": "Number of Additional Toilets Required",
        "toilet_repair_description": "Brief description of repair needed for toilets",
        "septic_tank_1_1": "Septic Tank",
        "water_source_1_1": "Source of Potable Water",
        "water_recommendations": "Water Source Recommendations",
        "electricity_source_1_1": "Source of Electricity",
        "electricity_additional_info": "Additional Information on Electricity",
        "waterlogged": "Is the school regularly waterlogged when it rains?",
        "completion_rate_set1_admitted_1_1": "Completion Rate Set 1 - Admitted",
        "completion_rate_set1_completed_1_1": "Completion Rate Set 1 - Completed",
        "completion_rate_set1_percentage_1_1": "Completion Rate Set 1 - Percentage",
        "completion_rate_set2_admitted_1_1": "Completion Rate Set 2 - Admitted",
        "completion_rate_set2_completed_1_1": "Completion Rate Set 2 - Completed",
        "completion_rate_set2_percentage_1_1": "Completion Rate Set 2 - Percentage",
        "completion_rate_set3_admitted_1_1": "Completion Rate Set 3 - Admitted",
        "completion_rate_set3_completed_1_1": "Completion Rate Set 3 - Completed",
        "completion_rate_set3_percentage_1_1": "Completion Rate Set 3 - Percentage",
        "completion_rate_set4_admitted_1_1": "Completion Rate Set 4 - Admitted",
        "completion_rate_set4_completed_1_1": "Completion Rate Set 4 - Completed",
        "completion_rate_set4_percentage_1_1": "Completion Rate Set 4 - Percentage",
        "completion_rate_set5_admitted_1_1": "Completion Rate Set 5 - Admitted",
        "completion_rate_set5_completed_1_1": "Completion Rate Set 5 - Completed",
        "completion_rate_set5_percentage_1_1": "Completion Rate Set 5 - Percentage",
        "completion_rate_set6_admitted_1_1": "Completion Rate Set 6 - Admitted",
        "completion_rate_set6_completed_1_1": "Completion Rate Set 6 - Completed",
        "completion_rate_set6_percentage_1_1": "Completion Rate Set 6 - Percentage",
    },
    "tcmats": {
        "tcmats_institution": "Institution",
        "tcmats_lgea": "LGEA",
        "tcmats_schoolName": "Name of School",
        "tcmats_teacherName": "Teacher's Name",
        "tcmats_location": "Location",
        "tcmats_highest_qualification": "Highest Qualification",
        "tcmats_highest_qualification_other": "Other Qualification",
        "tcmats_areaOfSpecialization": "Area of Specialization",
        "tcmats_subjectsTaught": "Subject(s) Taught",
        "tcmats_periodsPerWeek": "No of periods per week",
        "tcmats_class": "Class",
        "tcmats_class_description": "Class Description",
        "tcmats_pupilsInClass": "No. of Pupils in Class",
        "tcmats_gender": "Gender",
        "tcmats_teaching_experience": "Years of Teaching Experience",
        "lesson_prep_1": "Preparation of your lesson plan",
        "lesson_prep_2": "Stating behavioural objectives for your lessons",
        "lesson_prep_3": "Distinguishing between behavioural objective and instructional objective",
        "lesson_prep_4": "Identifying learners’ entry behaviours",
        "lesson_prep_5": "Choosing of instructional aids for effective learning outcomes",
        "lesson_prep_6": "Differentiating between teacher’s activities and learner’s activities",
        "lesson_prep_7": "Allocating time to every part of the lesson plan",
        "lesson_prep_8": "Evaluating lesson objectives",
        "subject_mastery_1": "Determining subjects and topics that require reading from textbooks",
        "subject_mastery_2": "Teaching of difficult topics in your subject area",
        "subject_mastery_3": "Giving difficult concepts to learners as assignments",
        "subject_mastery_4": "Managing time to the extent that detailed explanations can be given",
        "subject_mastery_5": "Mastery of the subject I am to teach",
        "subject_mastery_6": "Making use of instructional materials in my lesson",
        "subject_mastery_7": "Measuring learning outcomes among learners",
        "subject_mastery_8": "Setting question for learners in my subject",
        "pedagogy_1": "Choosing method of teaching based on learner’s characteristics",
        "pedagogy_2": "Determining teaching methods suitable for the topics to be taught",
        "pedagogy_3": "Management of time allotted for lessons",
        "pedagogy_4": "How to use more than one teaching method at a time for a lesson",
        "pedagogy_5": "Use of illustrations in aiding thorough understanding",
        "pedagogy_6": "Allowing learners to think on their own",
        "pedagogy_7": "Treating learners based on their individual differences",
        "pedagogy_8": "Attending to all learners in the classroom",
        "classroom_management_1": "Knowing the names of all the learners in the classroom",
        "classroom_management_2": "Disciplining learners in the classroom",
        "classroom_management_3": "Rewarding obedient learners in the classroom",
        "classroom_management_4": "Sitting arrangement based on learner’s characteristics",
        "classroom_management_5": "Maintaining orderliness in the classroom",
        "classroom_management_6": "Ensuring that all learners participate in the class activities",
        "classroom_management_7": "Maintaining positive interpersonal relationship with the pupils",
        "classroom_management_8": "Encouraging learners who dislike difficult subjects",
        "classroom_management_9": "Gaining learners attention without the use of cane and abusive language",
        "classroom_management_10": "Equal distribution of questions irrespective of shortage of time",
        "classroom_management_11": "Making learners to show seriousness irrespective of the teacher’s personality",
        "classroom_management_12": "Use of classroom decorations in promoting learning",
        "instructional_materials_1": "Use of instructional materials based on learners’ age and interest",
        "instructional_materials_2": "Use of variety of instructional materials without confusion",
        "instructional_materials_3": "Improvisation of instructional materials despite poor funding",
        "instructional_materials_4": "Acquiring some special skills in craft for improvisation",
        "instructional_materials_5": "Teaching topics that do not require instructional materials",
        "evaluation_1": "Marking and grading of learners’ scripts/workbooks",
        "evaluation_2": "Setting questions in the three domains",
        "evaluation_3": "How to effectively allocate marks",
        "evaluation_4": "Managing time in carrying out serious evaluation process",
        "evaluation_5": "Effective use of questioning techniques during lessons",
        "ict_1": "Non provision of ICT equipment in the school",
        "ict_2": "Learning ICT through self-effort",
        "ict_3": "Non provision of ICT materials for teaching my subject",
        "ict_4": "Source of energy to power the ICT materials",
        "ict_5": "Accessing the use of ICT materials in the school",
        "ict_6": "Accessing ICT materials from the internet",
        "tcmats_difficult_topics": "Difficult Topics"
    },
    "lori": {
        "lori_lgea": "LGEA",
        "lori_school_name": "School Name",
        "lori_location": "Location",
        "lori_school_code": "School Code from Annual School Census",
        "lori_teacher_name": "Name of teacher observed",
        "lori_trcn_no": "Teacher’s TRCN No.",
        "lori_teacher_gender": "Teacher’s gender",
        "lori_teacher_phone": "Teacher’s phone number",
        "lori_pupils_female": "Number of pupils (Female)",
        "lori_pupils_male": "Number of pupils (Male)",
        "lori_pupils_total": "Total pupils",
        "lori_teacher_class_observed": "Teacher/Class observed",
        "lori_lesson_start_time": "Lesson Start Time",
        "lori_lesson_end_time": "Lesson End Time",
        "lori_subject_observed": "Subject observed",
        "lori_years_experience": "Years of Teaching Experience",
        "lori_observation_date": "Date Lesson is Observed",
        "lori_term": "Term",
        "lori_age": "Age",
        "lori_qualification": "Highest Teaching Qualification",
        "lori_b_1_a": "The content is relevant",
        "lori_b_1_b": "The content is delivered logically and sequentially",
        "lori_b_2_a": "The teacher prepared a lesson plan",
        "lori_b_2_b": "The introduction was stimulating and aroused the interest and curiosity of the learners",
        "lori_b_2_c": "The teacher referred to previous lessons and skills",
        "lori_b_3_a": "Every learner is involved in learning and enjoying it",
        "lori_b_3_b": "The teacher uses a variety of instructional materials to explain the concept",
        "lori_b_3_c": "The learners use a variety of instructional materials to practice the concept",
        "lori_b_3_d": "The learners have relevant text/workbooks",
        "lori_b_3_e": "The learners have relevant writing materials such as pencils, biro, colouring pens, etc.",
        "lori_b_3_f": "The teacher uses /displays audio-visual materials in the class",
        "lori_b_3_g": "The teacher uses various ways of grouping learners",
        "lori_b_3_h": "The teacher uses language that is relevant and understandable to the learners",
        "lori_b_3_i": "The teacher gives clear instructions to the learners",
        "lori_b_3_j": "New words and concepts are clearly explained and related to learners’ experiences",
        "lori_b_4_a": "The teacher uses learners’ names when addressing them individually",
        "lori_b_4_b": "The teacher is fair and inclusive in their teaching and feedback",
        "lori_b_4_c": "The teacher has empathy for the learners",
        "lori_b_4_d": "The teacher responds to individual learners according to their need",
        "lori_b_4_e": "The teacher is a role model to the learners",
        "lori_b_5_a": "Every learner can see the teacher and the board",
        "lori_b_5_b": "The teacher praises and rewards the learners",
        "lori_b_5_c": "The teacher encourages good behaviour among learners",
        "lori_b_5_d": "The teacher is confident in his/her presentation",
        "lori_b_5_e": "The teacher does not use a cane, use physical force, or threatens learners",
        "lori_b_6_a": "The lesson objectives are clearly stated at the beginning of the lesson",
        "lori_b_6_b": "The teacher walks around the room for effective teaching and learning",
        "lori_b_6_c": "The teacher uses a variety of assessment techniques",
        "lori_b_6_d": "The teacher invites learners to ask questions and responds appropriately",
        "lori_b_6_e": "The teacher checks the achievement of the lesson objectives at the end of the lesson through relevant text",
        "lori_b_6_f": "The teacher gave relevant homework if need be",
        "lori_b_7": "Overall Assessment",
        "lori_c_went_well_1": "What two things went very well? (i)",
        "lori_c_went_well_2": "What two things went very well? (ii)",
        "lori_c_could_be_different_1": "What two things could be done differently next time? (i)",
        "lori_c_could_be_different_2": "What two things could be done differently next time? (ii)",
        "lori_c_support_needed": "What support is needed going forward and on which area",
        "lori_c_teacher_name": "Name of Teacher",
        "lori_c_teacher_signature": "Phone Number",
        "lori_c_teacher_date": "Date",
        "lori_c_observer_name_2": "Name of Observer",
        "lori_c_observer_designation": "Designation",
        "lori_c_observer_phone": "Phone Number",
        "lori_c_observer_date": "Date",
        "toilet_renovation_required_male": "Male Toilets Renovation Required",
        "toilet_repair_description_male": "Male Toilets Repair Description",
        "toilet_renovation_required_female": "Female Toilets Renovation Required",
        "toilet_repair_description_female": "Female Toilets Repair Description",
        "toilet_renovation_required_staff": "Staff Toilets Renovation Required",
        "toilet_repair_description_staff": "Staff Toilets Repair Description"
    },
    "voices": {
        "voices_institution": "Institution",
        "voices_lgea": "LGEA",
        "voices_schoolName": "Name of School",
        "tcmats_location": "Location",
        "voices_class": "Class",
        "voices_class_description": "Class Description",
        "voices_gender": "Gender",
        "voices_distance": "Average distance of School from your home",
        "voices_difficult_topics": "List the Subjects or Topics that you find very difficult to understand (Mention 2-5)",
        "participation_1": "I regularly ask questions during the lessons.",
        "participation_2": "I regularly answer the teachers’ questions.",
        "participation_3": "I give explanation/suggestion of activity to my classmate during lessons.",
        "participation_4": "I am given the opportunity to demonstrate activity to my classmate.",
        "participation_5": "I am allowed to make suggestion of possible results of the activity.",
        "participation_6": "I make observation during lessons’ activities.",
        "participation_7": "I record my observation during the activities.",
        "participation_8": "I am given the opportunity to participate in discussion of the results of the activities.",
        "participation_9": "I write my own ideas in addition to those given by the teacher.",
        "participation_10": "I take care of my safety and classmates during classroom activities.",
        "participation_11": "I encourage my classmates to record observations.",
        "participation_12": "I help my group to pay attention to classroom activities.",
        "participation_13": "I make a true record of my observations.",
        "participation_14": "I accept my classmates’ option.",
        "participation_15": "I participate in cleaning the area after the activities.",
        "school_building": "School Building",
        "furniture": "Learners’ Furniture in your Class",
        "classroom_condition": "Classroom Condition",
        "perimeter_fence": "Does the School have perimeter fence",
        "fence_state": "If Yes, in what State?",
        "toilet_type": "Type of Toilet",
        "toilet_cubicles_available": "Number of Cubicle Toilet Available",
        "toilet_cubicles_minor_repair": "Number in need of Minor Repair",
        "toilet_cubicles_major_repair": "Number in need of Major Repair",
        "toilet_cubicles_additional": "Number of Additional Cubicle Toilet Required",
        "septic_tank": "Septic Tank (Soak-away)",
        "water_source": "Source(s) of Portable Water",
        "electricity_source": "Sources of Electricity",
        "clubs": "Which of these Clubs and Societies is available in your School?",
        "clubs_frequency": "How often do you do Clubs and Societies Activities in your School?",
        "sports_equipment": "Which of these Sport equipment is available in your School?",
        "waterlogged": "Is your School regularly waterlogged when it rained?",
        "major_requests": "List Two major Requests Government should provide for your School"
    },
    "silat_1.2": {
        "silnat_a_ht_name": "Head Teacher/Manager Name",
        "silnat_a_ht_contact": "Contact Number",
        "gender_1.2": "Gender",
        "marital_status_1.2": "Marital Status",
        "highest_qualification_1.2": "Highest Qualification",
        "leadership_experience_1.2": "Years of Leadership Experience",
        "silnat_a_institution_type": "Institution Type",
        "silat_1_2_localGov": "Local Govt Educ Auth",
        "silat_1_2_schoolName": "Name of School/Institution",
        "silat_1_2_address": "Address",
        "silat_1_2_location": "Location",
        "silat_1_2_assembly_start": "Assembly Devotion: Time Start",
        "silat_1_2_assembly_end": "Assembly Devotion: Time End",
        "silat_1_2_teachers_male": "Number of Teachers (Male)",
        "silat_1_2_teachers_female": "Number of Teachers (Female)",
        "silat_1_2_teachers_total": "Total Teachers",
        "silat_1_2_spec_ed_teachers_male": "Number of Teachers with Specialization in Special Education (Male)",
        "silat_1_2_spec_ed_teachers_female": "Number of Teachers with Specialization in Special Education (Female)",
        "silat_1_2_spec_ed_teachers_total": "Total Special Education Teachers",
        "silat_1_2_non_teaching_male": "Number of Non-Teaching Staff (Male)",
        "silat_1_2_non_teaching_female": "Number of Non-Teaching Staff (Female)",
        "silat_1_2_non_teaching_total": "Total Non-Teaching Staff",
        "silat_1_2_learners_male": "Number of Learners (Male)",
        "silat_1_2_learners_female": "Number of Learners (Female)",
        "silat_1_2_learners_total": "Total Learners",
        "silat_1_2_special_learners": "Category of Special Learners catered for",
        "silat_1_2_teacher_pupil_ratio": "Teacher/Pupils Ratio",
        "silat_1_2_additional_staff_required": "Number of Additional Teachers/Staff Required",
        "silat_1_2_multigrade_classes": "Number of Classes operated as Multigrade",
        "silat_1_2_multigrade_reasons": "Reason(s) for operating the classes as Multigrade",
        "discipline_a_1.1": "Getting Teachers and Learners to obey rules and regulations",
        "discipline_b_1.1": "Handling of disciplinary cases on time and appropriately",
        "discipline_c_1.1": "Effecting discipline of misconduct in the School",
        "discipline_d_1.1": "Handling cases of lateness, truancy, etc. in the School",
        "discipline_e_1.1": "Handling cases of professional misconduct by teachers School",
        "cooperation_a_1.1": "Assigning administrative responsibilities in the school to teachers",
        "cooperation_b_1.1": "Delegating of duties to subordinates",
        "cooperation_c_1.1": "Getting Teachers to work cooperatively to carry out assigned duties",
        "cooperation_d_1.1": "Encouraging team work in the School",
        "communication_a_1.1": "Establishing effective channel of communication in the School",
        "communication_b_1.1": "Guaranteeing freedom of expression in the School",
        "communication_c_1.1": "Encouraging good communication skills among staff and learners",
        "community_a_1.1": "Getting the communities to be committed to the school activities",
        "community_b_1.1": "Getting Teachers to relate well with the School community",
        "community_c_1.1": "Institutionalizing SBMC in the School",
        "community_d_1.1": "Getting SBMC actively involved in the management and provision of facilities in the school",
        "community_e_1.1": "Involving former pupils in the School activities",
        "supervision_a_1.1": "Assessing Teachers’ lesson plan before delivery",
        "supervision_b_1.1": "Getting Teachers supevised during lesson presentations",
        "supervision_c_1.1": "Monitoring tests and assignments in the School",
        "supervision_d_1.1": "Monitoring of class attendances of teachers and learners",
        "supervision_e_1.1": "Supervision of co-curricular activities in the School",
        "records_a_1.1": "Maintaining the School Log Book",
        "records_b_1.1": "Maintenance of daily classroom register by teachers",
        "records_c_1.1": "Maintaining Weekly Diaries",
        "records_d_1.1": "Maintenance of Teachers' Movement Book",
        "records_e_1.1": "Keeping of Teachers' Time-book",
        "records_f_1.1": "Keeping of Admission Register",
        "records_g_1.1": "Keeping of Minutes of Staff meetings",
        "records_h_1.1": "Keeping of Examination Records",
        "records_i_1.1": "Keeping of Visitors Book",
        "health_a_1.1": "Keeping the school compound clean",
        "health_b_1.1": "Keeping and stocking of First Aid box",
        "health_c_1.1": "Getting the pupils obey hygienic rules",
        "health_d_1.1": "Getting medical services for the pupils",
        "health_e_1.1": "Hand Washing Station",
        "health_f_1.1": "Waste Disposal Bin",
        "signboard_1_2": "Signboard",
        "teachers_furniture_available": "Teachers’ Furniture (Number Available)",
        "teachers_furniture_good": "Teachers’ Furniture (Number in Good Condition)",
        "teachers_furniture_required": "Teachers’ Furniture (Additional Number Required)",
        "eccde_furniture_available": "ECCDE Furniture (Number Available)",
        "eccde_furniture_good": "ECCDE Furniture (Number in Good Condition)",
        "eccde_furniture_required": "ECCDE Furniture (Additional Number Required)",
        "primary_furniture_available": "Primary Furniture (Number Available)",
        "primary_furniture_good": "Primary Furniture (Number in Good Condition)",
        "primary_furniture_required": "Primary Furniture (Additional Number Required)",
        "classroom_available": "Classroom (Number Available)",
        "classroom_good": "Classroom (Number in Good Condition)",
        "classroom_minor_repair": "Classroom (Number in need of Minor Repair)",
        "classroom_major_repair": "Classroom (Number in need of Major Repair/Renovation)",
        "classroom_required": "Number of Additional Classroom Required",
        "classroom_repair_description": "Briefly, describe the type of repair needed",
        "shared_facility_1_2": "Is the school located within a school Complex?",
        "shared_facility_schools": "If Yes, Kindly list other Schools within the Complex",
        "perimeter_fence_1_2": "Does the school have perimeter fence",
        "fence_condition_1_2": "If Yes, in what State?",
        "fence_repair_description": "Briefly, describe the type of repair needed",
        "school_perimeter": "If No, what is the perimeter of the School?",
        "toilet_type_1_2": "Type of Toilet",
        "toilet_cubicle_available": "Number of Cubicle Toilet Available",
        "toilet_minor_repair": "Number in need of Minor Repair",
        "toilet_major_repair": "Number in need of Major Repair",
        "toilet_renovation_required": "Renovation Required",
        "toilet_additional_required": "Number of Additional Cubicle Toilet Required",
        "septic_tank_1_2": "Septic Tank",
        "water_source_1_2": "Source of Potable Water",
        "water_recommendations": "Recommendations",
        "electricity_source_1_2": "Source of Electricity",
        "electricity_additional_info": "Additional information e.g., amount involved, etc",
        "waterlogged": "Is your School regularly waterlogged when it rained?",
        "facility_a_name": "Facility A Name",
        "facility_a_status": "Facility A Status",
        "facility_a_available": "Facility A Number Available",
        "facility_a_needed": "Facility A Number Needed More",
        "facility_b_name": "Facility B Name",
        "facility_b_status": "Facility B Status",
        "facility_b_available": "Facility B Number Available",
        "facility_b_needed": "Facility B Number Needed More",
        "facility_c_name": "Facility C Name",
        "facility_c_status": "Facility C Status",
        "facility_c_available": "Facility C Number Available",
        "facility_c_needed": "Facility C Number Needed More",
        "facility_d_name": "Facility D Name",
        "facility_d_status": "Facility D Status",
        "facility_d_available": "Facility D Number Available",
        "facility_d_needed": "Facility D Number Needed More",
        "facility_e_name": "Facility E Name",
        "facility_e_status": "Facility E Status",
        "facility_e_available": "Facility E Number Available",
        "facility_e_needed": "Facility E Number Needed More",
        "facility_f_name": "Facility F Name",
        "facility_f_status": "Facility F Status",
        "facility_f_available": "Facility F Number Available",
        "facility_f_needed": "Facility F Number Needed More",
        "facility_g_name": "Facility G Name",
        "facility_g_status": "Facility G Status",
        "facility_g_available": "Facility G Number Available",
        "facility_g_needed": "Facility G Number Needed More",
        "facility_h_name": "Facility H Name",
        "facility_h_status": "Facility H Status",
        "facility_h_available": "Facility H Number Available",
        "facility_h_needed": "Facility H Number Needed More",
        "facility_i_name": "Facility I Name",
        "facility_i_status": "Facility I Status",
        "facility_i_available": "Facility I Number Available",
        "facility_i_needed": "Facility I Number Needed More",
        "completion_rate_set1_admitted_1_2": "Completion Rate Set 1 - Admitted",
        "completion_rate_set1_completed_1_2": "Completion Rate Set 1 - Completed",
        "completion_rate_set1_percentage_1_2": "Completion Rate Set 1 - Percentage",
        "completion_rate_set2_admitted_1_2": "Completion Rate Set 2 - Admitted",
        "completion_rate_set2_completed_1_2": "Completion Rate Set 2 - Completed",
        "completion_rate_set2_percentage_1_2": "Completion Rate Set 2 - Percentage",
        "completion_rate_set3_admitted_1_2": "Completion Rate Set 3 - Admitted",
        "completion_rate_set3_completed_1_2": "Completion Rate Set 3 - Completed",
        "completion_rate_set3_percentage_1_2": "Completion Rate Set 3 - Percentage",
        "completion_rate_set4_admitted_1_2": "Completion Rate Set 4 - Admitted",
        "completion_rate_set4_completed_1_2": "Completion Rate Set 4 - Completed",
        "completion_rate_set4_percentage_1_2": "Completion Rate Set 4 - Percentage",
        "completion_rate_set5_admitted_1_2": "Completion Rate Set 5 - Admitted",
        "completion_rate_set5_completed_1_2": "Completion Rate Set 5 - Completed",
        "completion_rate_set5_percentage_1_2": "Completion Rate Set 5 - Percentage",
        "completion_rate_set6_admitted_1_2": "Completion Rate Set 6 - Admitted",
        "completion_rate_set6_completed_1_2": "Completion Rate Set 6 - Completed",
        "completion_rate_set6_percentage_1_2": "Completion Rate Set 6 - Percentage",
    },
    "silat_1.3": {
        "silnat_a_ht_name": "Head Teacher/Manager Name",
        "silnat_a_ht_contact": "Contact Number",
        "gender_1.3": "Gender",
        "marital_status_1.3": "Marital Status",
        "highest_qualification_1.3": "Highest Qualification",
        "highest_qualification_other_1.3": "Other Qualification",
        "leadership_experience_1.3": "Years of Leadership Experience",
        "silat13_lgea": "Local Govt Educ Auth",
        "silat13_school_name": "Name of School/Institution",
        "silat13_address": "Address",
        "silat13_location": "Location",
        "silat13_vocation_type": "Types of Vocation Taught at the centre",
        "silat13_instructors_male": "Number of Instructors (Male)",
        "silat13_instructors_female": "Number of Instructors (Female)",
        "silat13_instructors_total": "Total Instructors",
        "silat13_qualified_teachers_male": "Number of Professionally Qualified Vocational Teachers (Male)",
        "silat13_qualified_teachers_female": "Number of Professionally Qualified Vocational Teachers (Female)",
        "silat13_qualified_teachers_total": "Total Professionally Qualified Vocational Teachers",
        "silat13_non_teaching_male": "Number of Non-Teaching Staff (Male)",
        "silat13_non_teaching_female": "Number of Non-Teaching Staff (Female)",
        "silat13_non_teaching_total": "Total Non-Teaching Staff",
        "silat13_schools_supported": "Number of Schools your Centre is supporting",
        "silat13_avg_distance": "Average Distance of farthest School among the Schools under your support to the Centre in Kilometre",
        "silat13_learners_male": "Average Number of Learners Attending training at the Centre (Male)",
        "silat13_learners_female": "Average Number of Learners Attending training at the Centre (Female)",
        "silat13_learners_total": "Total Learners Attending training",
        "silat13_instructor_pupil_ratio": "Instructor/Pupils Ratio",
        "silat13_additional_staff": "Number of Additional Instructors/Staff Required",
        "discipline_a_1.2": "Getting Teachers and Learners to obey rules and regulations",
        "discipline_b_1.2": "Handling of disciplinary cases on time and appropriately",
        "discipline_c_1.2": "Effecting discipline of misconduct in the School",
        "discipline_d_1.2": "Handling cases of lateness, truancy, etc. in the School",
        "discipline_e_1.2": "Handling cases of professional misconduct by teachers School",
        "cooperation_a_1.2": "Assigning administrative responsibilities in the school to teachers",
        "cooperation_b_1.2": "Delegating of duties to subordinates",
        "cooperation_c_1.2": "Getting Teachers to work cooperatively to carry out assigned duties",
        "cooperation_d_1.2": "Encouraging team work in the School",
        "communication_a_1.2": "Establishing effective channel of communication in the School",
        "communication_b_1.2": "Guaranteeing freedom of expression in the School",
        "communication_c_1.2": "Encouraging good communication skills among staff and learners",
        "community_a_1.2": "Getting the communities to be committed to the school activities",
        "community_b_1.2": "Getting Teachers to relate well with the School community",
        "community_c_1.2": "Institutionalizing SBMC in the School",
        "community_d_1.2": "Getting SBMC actively involved in the management and provision of facilities in the school",
        "community_e_1.2": "Involving former pupils in the School activities",
        "supervision_a_1.2": "Assessing Teachers’ lesson plan before delivery",
        "supervision_b_1.2": "Getting Teachers supevised during lesson presentations",
        "supervision_c_1.2": "Monitoring tests and assignments in the School",
        "supervision_d_1.2": "Monitoring of class attendances of teachers and learners",
        "supervision_e_1.2": "Supervision of co-curricular activities in the School",
        "records_a_1.2": "Maintaining the School Log Book",
        "records_b_1.2": "Maintenance of daily classrom register by teachers",
        "records_c_1.2": "Maintaining Weekly Diaries",
        "records_d_1.2": "Maintenance of Teachers' Movement Book",
        "records_e_1.2": "Keeping of Teachers' Time-book",
        "records_f_1.2": "Keeping of Admission Register",
        "records_g_1.2": "Keeping of Minutes of Staff meetings",
        "records_h_1.2": "Keeping of Examination Records",
        "records_i_1.2": "Keeping of Visitors Book",
        "health_a_1.2": "Keeping the school compound clean",
        "health_b_1.2": "Keeping and stocking of First Aid box",
        "health_c_1.2": "Getting the pupils obey hygienic rules",
        "health_d_1.2": "Getting medical services for the pupils",
        "health_e_1.2": "Hand Washing Station",
        "health_f_1.2": "Waste Disposal Bin",
        "signboard_1_3": "Signboard",
        "teachers_furniture_available": "Teachers’ Furniture (Number Available)",
        "teachers_furniture_good": "Teachers’ Furniture (Number in Good Condition)",
        "teachers_furniture_required": "Teachers’ Furniture (Additional Number Required)",
        "learners_furniture_available": "Learners Furniture (Number Available)",
        "learners_furniture_good": "Learners Furniture (Number in Good Condition)",
        "learners_furniture_required": "Learners Furniture (Additional Number Required)",
        "classroom_available": "Classroom (Number Available)",
        "classroom_good": "Classroom (Number in Good Condition)",
        "classroom_minor_repair": "Classroom (Number in need of Minor Repair)",
        "classroom_major_repair": "Classroom (Number in need of Major Repair/Renovation)",
        "classroom_required": "Number of Additional Classroom Required",
        "classroom_repair_description": "Briefly, describe the type of repair needed",
        "shared_facility_1_3": "Is the school located within a school Complex?",
        "shared_facility_schools_1.1": "If Yes, Kindly list other Schools within the Complex",
        "perimeter_fence_1_3": "Does the school have perimeter fence",
        "fence_condition_1_3": "If Yes, in what State?",
        "fence_repair_description_1.1": "Briefly, describe the type of repair needed",
        "school_perimeter_1.1": "If No, what is the perimeter of the School?",
        "toilet_type_1_3": "Type of Toilet",
        "toilet_cubicle_available": "Number of Cubicle Toilet Available",
        "toilet_minor_repair": "Number in need of Minor Repair",
        "toilet_major_repair": "Number in need of Major Repair",
        "toilet_renovation_required": "Renovation Required",
        "toilet_additional_required": "Number of Additional Cubicle Toilet Required",
        "toilet_repair_description": "Briefly, describe the type of repair needed",
        "septic_tank_1_3": "Septic Tank",
        "water_source_1_3": "Source of Potable Water",
        "water_recommendations": "Recommendations",
        "electricity_source_1_3": "Source of Electricity",
        "electricity_additional_info": "Additional information e.g., amount involved, etc",
        "waterlogged": "Is your School regularly waterlogged when it rained?"
    },
    "silat_1.4": {
        "gender_1.4": "Gender",
        "marital_status_1.4": "Marital Status",
        "highest_qualification_1.4": "Highest Qualification",
        "highest_qualification_other_1.4": "Other Qualification",
        "leadership_experience_1.4": "Years of Leadership Experience",
        "silat_1_4_localGov": "Local Govt Educ Auth",
        "silat_1_4_schoolName": "Name of School/Institution",
        "lgea_address_1.4": "Address",
        "location_1.4": "Location",
        "staff_male_1.4": "Number of Staff in the Local Govt Educ Auth (Male)",
        "staff_female_1.4": "Number of Staff in the Local Govt Educ Auth (Female)",
        "staff_total_1.4": "Total Staff",
        "teachers_male_1.4": "Number of Staff that are Professional Teachers (Male)",
        "teachers_female_1.4": "Number of Staff that are Professional Teachers (Female)",
        "teachers_total_1.4": "Total Professional Teachers",
        "non_teaching_male_1.4": "Number of Non-teaching Staff at the Local Govt Educ Auth (Male)",
        "non_teaching_female_1.4": "Number of Non-teaching Staff at the Local Govt Educ Auth (Female)",
        "non_teaching_total_1.4": "Total Non-teaching Staff",
        "discipline_a_1.4": "Getting Staff to obey rules and regulations",
        "discipline_b_1.4": "Handling of disciplinary cases on time and appropriately",
        "discipline_c_1.4": "Effecting discipline of misconduct in the Local Govt Educ Auth and Schools",
        "discipline_d_1.4": "Handling cases of lateness, truancy, etc. in the Local Govt Educ Auth and Schools",
        "discipline_e_1.4": "Handling cases of professional misconduct by Staff in the Local Govt Educ Auth and Schools",
        "cooperation_a_1.4": "Assigning administrative responsibilities to Staff in the Local Govt Educ Auth",
        "cooperation_b_1.4": "Delegating of duties to subordinates",
        "cooperation_c_1.4": "Getting Staff to work cooperatively to carry out assigned duties",
        "cooperation_d_1.4": "Encouraging team work in the Local Govt Educ Auth and Schools",
        "communication_a_1.4": "Establishing effective channel of communication in the Local Govt Educ Auth and Schools",
        "communication_b_1.4": "Guaranteeing freedom of expression in the Local Govt Educ Auth and Schools",
        "communication_c_1.4": "Encouraging good communication skills among staff and Schools",
        "community_a_1.4": "Getting the communities to be committed to the Local Govt Educ Auth and school activities",
        "community_b_1.4": "Getting Staff to relate well with the immediate community",
        "community_c_1.4": "Institutionalizing SBMC in the Schools",
        "community_d_1.4": "Getting SBMC actively involved in the management and provision of facilities in the schools",
        "community_e_1.4": "Involving former pupils in the School activities",
        "supervision_a_1.4": "Assessing Headteachers’ Statutory Records",
        "supervision_b_1.4": "Assessing Teachers’ Records",
        "supervision_c_1.4": "Monitoring Movement of Staff at the Local Govt Educ Auth and Schools",
        "supervision_d_1.4": "Supervision of activities at the Local Govt Educ Auth and Schools",
        "records_a_1.4": "Maintaining the Local Govt Educ Auth Log Book",
        "records_b_1.4": "Maintenance of Staff’ Movement Book",
        "records_c_1.4": "Keeping Staff’ Time-book",
        "records_d_1.4": "Keeping of Minutes of Staff meetings",
        "records_e_1.4": "Keeping of Visitors Book",
        "health_a_1.4": "Keeping the Local Govt Educ Auth compound clean",
        "health_b_1.4": "Keeping and stocking of First Aid box",
        "health_c_1.4": "Getting the Staff to obey hygienic rules",
        "health_d_1.4": "Getting medical services for the Staff",
        "health_e_1.4": "Waste Disposal Bin",
        "signboard_1.4": "Signboard",
        "structure_condition_1.4": "Description of the External Features of the Local Govt Educ Auth Structure",
        "offices_good_condition_1.4": "Available Offices (Number in Good Condition)",
        "offices_minor_repairs_1.4": "Available Offices (Need Minor Repairs)",
        "offices_major_repairs_1.4": "Available Offices (Needs Major Repairs)",
        "offices_renovation_required_1.4": "Available Offices (Renovation Required)",
        "offices_additional_required_1.4": "Number of Additional offices required",
        "repair_description_1.4": "Briefly, describe the type of repair/construction needed",
        "staff_furniture_available_1.4": "Staff’ Furniture (Number Available)",
        "staff_furniture_good_condition_1.4": "Staff’ Furniture (Number in Good Condition)",
        "staff_furniture_required_1.4": "Staff’ Furniture (Additional Number Required)",
        "offices_available_1.4": "Condition of Offices (Number Available)",
        "offices_good_condition_2_1.4": "Condition of Offices (Number in Good Condition)",
        "offices_minor_repair_1.4": "Condition of Offices (Number in need of Minor Repair)",
        "offices_major_repair_1.4": "Condition of Offices (Number in need of Major Repair/Renovation)",
        "offices_additional_required_2_1.4": "Number of Additional Classroom Required",
        "repair_description_2_1.4": "Briefly, describe the type of repair needed",
        "shared_facility_1.4": "Is the Local Govt Educ Auth located within a school Complex?",
        "shared_facility_schools_1.4": "If Yes, Kindly list Schools within the Complex",
        "perimeter_fence_1.4": "Does the Local Govt Educ Auth have perimeter fence",
        "fence_condition_1.4": "If Yes, in what State?",
        "fence_repair_description_1.4": "Briefly, describe the type of repair needed",
        "lgea_perimeter_1.4": "If No, what is the perimeter of the Local Govt Educ Auth?",
        "toilet_type_1.4": "Type of Toilet",
        "toilet_cubicle_available_1.4": "Number of Cubicle Toilet Available",
        "toilet_minor_repair_1.4": "Number in need of Minor Repair",
        "toilet_major_repair_1.4": "Number in need of Major Repair",
        "toilet_renovation_required_1.4": "Renovation Required",
        "toilet_additional_required_1.4": "Number of Additional Cubicle Toilet Required",
        "toilet_repair_description_1.4": "Briefly, describe the type of repair needed",
        "septic_tank_1.4": "Septic Tank",
        "water_source_1.4": "Source of Potable Water",
        "water_recommendations_1.4": "Recommendations",
        "electricity_source_1.4": "Source of Electricity",
        "electricity_additional_info_1.4": "Additional information e.g., amount involved, etc",
        "monitoring_vehicles_1.4": "Monitoring Vehicles",
        "monitoring_vehicles_needed_1.4": "Number Needed",
        "waterlogged_1.4": "Is your Local Govt Educ Auth regularly waterlogged when it rained?"
    }
};

// New streaming export endpoint for any survey type
app.get('/api/export/:surveyType/csv', protect, async (req, res) => {
    try {
        const { surveyType } = req.params;
        const query = { surveyType };

        // First pass: Collect all unique headers from formData to ensure a consistent CSV structure
        const headers = new Set(['username', 'createdAt']);
        const headerCursor = SurveyResponse.find(query).lean().cursor();
        for await (const doc of headerCursor) {
            if (doc.formData) {
                const flattened = flattenObjectForCsv(doc.formData);
                Object.keys(flattened).forEach(key => headers.add(key));
            }
        }
        const fields = Array.from(headers);
        const json2csvParser = new Parser({ fields });

        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${surveyType}-export-${new Date().toISOString()}.csv`);

        // Second pass: Stream data and convert to CSV row by row
        const dataCursor = SurveyResponse.find(query).populate('user', 'username').lean().cursor();

        // Write headers first
        res.write(json2csvParser.parse());

        for await (const doc of dataCursor) {
            const flattenedData = {
                username: doc.user ? doc.user.username : 'N/A',
                createdAt: doc.createdAt.toISOString(),
                ...flattenObjectForCsv(doc.formData || {})
            };
            const csvRow = json2csvParser.parse(flattenedData, { header: false });
            res.write(`\n${csvRow}`);
        }

        res.end();

    } catch (error) {
        console.error(`Error exporting ${req.params.surveyType} to CSV:`, error);
        // Ensure the client knows the request failed
        if (!res.headersSent) {
            res.status(500).send('Error exporting to CSV');
        } else {
            res.end(); // End the stream if headers were already sent
        }
    }
});

// New Excel export endpoint for any survey type
app.get('/api/export/:surveyType/excel', protect, async (req, res) => {
    try {
        const { surveyType } = req.params;
        const query = { surveyType };
        const submissions = await SurveyResponse.find(query).populate('user', 'username').lean();

        if (submissions.length === 0) {
            return res.status(404).send('No data to export.');
        }

        const labelMap = surveyLabelMaps[surveyType] || {};
        const dataForExcel = submissions.map(sub => {
            const row = {
                'Username': sub.user ? sub.user.username : 'N/A',
                'Submission Date': new Date(sub.createdAt).toLocaleString(),
            };
            const formData = sub.formData || {};
            for (const key in formData) {
                const label = labelMap[key] || key;
                row[label] = formData[key];
            }
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', `attachment; filename="${surveyType}-export-${new Date().toISOString()}.xlsx"`);
        res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error(`Error exporting ${req.params.surveyType} to Excel:`, error);
        res.status(500).send('Error exporting to Excel');
    }
});


// GET endpoint for ALL survey reports by type (for exports)
app.get('/api/reports/:type/all', protect, async (req, res) => {
  try {
    const surveyType = req.params.type;
    const surveys = await SurveyResponse.find({ surveyType: surveyType })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    res.status(200).json(surveys);
  } catch (error) {
    console.error(`Error fetching all ${req.params.type} reports:`, error);
    res.status(500).json({ message: 'Failed to fetch all reports.', error: error.message });
  }
});

// GET endpoint for survey reports by type
app.get('/api/reports/:type', protect, async (req, res) => {
  try {
    const surveyType = req.params.type;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { surveyType: surveyType };

    const totalSurveys = await SurveyResponse.countDocuments(query);
    const surveys = await SurveyResponse.find(query)
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      responses: surveys,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSurveys / limit),
        totalResponses: totalSurveys
      }
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.type} reports:`, error);
    res.status(500).json({ message: 'Failed to fetch reports.', error: error.message });
  }
});

// DELETE endpoint for a single survey report
app.delete('/api/reports/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await SurveyResponse.findById(id);

    if (survey) {
      await survey.deleteOne();
      res.json({ message: 'Survey report deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Survey report not found.' });
    }
  } catch (error) {
    console.error(`Error deleting survey report:`, error);
    res.status(500).json({ message: 'Failed to delete survey report.', error: error.message });
  }
});

// DELETE endpoint for all survey reports of a specific type
app.delete('/api/reports/all/:type', protect, admin, async (req, res) => {
  try {
    const { type } = req.params;
    const result = await SurveyResponse.deleteMany({ surveyType: type });
    res.json({ message: `${result.deletedCount} survey reports of type '${type}' deleted successfully.` });
  } catch (error) {
    console.error(`Error deleting all survey reports of type ${type}:`, error);
    res.status(500).json({ message: `Failed to delete survey reports of type ${type}.`, error: error.message });
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

app.get('/submission_logs.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'submission_logs.html'));
});

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
