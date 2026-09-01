const { Student, User, SessionLog, WeekendCheckIn, Consent, SessionGuide } = require('../models');
const { suggestTutorsForStudent } = require('../utils/tutorMatching');

// ========================================================
// Users Management
// ========================================================

// Get tutors and parents (for coordinator selection)
exports.getStaffAndParents = async (req, res) => {
  try {
    const tutors = await User.find({ role: 'tutor' });
    const parents = await User.find({ role: 'parent' });
    
    // Clean passwords
    const cleanTutors = tutors.map(u => ({
      id: u._id,
      name: u.name,
      username: u.username,
      tutorStatus: u.tutorStatus || 'active'
    }));
    const cleanParents = parents.map(u => ({ id: u._id, name: u.name, username: u.username }));

    res.json({ tutors: cleanTutors, parents: cleanParents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a tutor account (coordinator)
exports.createTutor = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, username, password, phone } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required' });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const tutor = await User.create({
      username,
      password: hashedPassword,
      role: 'tutor',
      name,
      phone: phone || '',
      schoolName: req.user.schoolName || 'Village School A',
      tutorStatus: 'active'
    });

    res.status(201).json({
      id: tutor._id,
      name: tutor.name,
      username: tutor.username,
      tutorStatus: tutor.tutorStatus || 'active'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tutor updates own availability status
exports.updateTutorStatus = async (req, res) => {
  try {
    const { tutorStatus } = req.body;

    if (!['active', 'on_break'].includes(tutorStatus)) {
      return res.status(400).json({ error: 'Status must be active or on_break' });
    }

    if (req.user.role !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can update tutor status' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { tutorStatus },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: updated._id,
      username: updated.username,
      role: updated.role,
      name: updated.name,
      phone: updated.phone,
      schoolName: updated.schoolName,
      tutorStatus: updated.tutorStatus || 'active'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// Students CRUD & Assignments
// ========================================================

// Get all students (role-filtered)
exports.getStudents = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'tutor') {
      query = { tutorId: req.user.id };
    } else if (req.user.role === 'parent') {
      query = { parentId: req.user.id };
    }

    const students = await Student.find(query).populate('tutorId parentId');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new student
exports.createStudent = async (req, res) => {
  try {
    const { name, grade, tutorId, parentId, readingLevel, mathLevel, schoolName } = req.body;

    if (!name || !grade) {
      return res.status(400).json({ error: 'Name and grade are required' });
    }

    const student = await Student.create({
      name,
      grade,
      tutorId: tutorId || null,
      parentId: parentId || null,
      learningLevel: {
        reading: readingLevel || 'Beginner',
        math: mathLevel || 'Beginner'
      },
      schoolName: schoolName || req.user.schoolName || 'Village School A'
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Suggest tutors automatically based on learning gap and tutor quality
exports.suggestTutorsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const tutors = await User.find({ role: 'tutor' });
    const logs = await SessionLog.find({});

    const workloadMap = {};
    const studentAssignments = await Student.find({ tutorId: { $ne: null } });
    studentAssignments.forEach((entry) => {
      if (!entry.tutorId) return;
      const id = String(entry.tutorId);
      workloadMap[id] = (workloadMap[id] || 0) + 1;
    });

    const rankedTutors = suggestTutorsForStudent(student, tutors, logs, workloadMap);
    const topMatches = rankedTutors.slice(0, 5).map((match) => ({
      tutor: {
        id: match.tutor._id,
        name: match.tutor.name,
        tutorStatus: match.tutor.tutorStatus || 'active',
        expertise: match.tutor.expertise || []
      },
      score: match.score,
      subject: match.subject,
      level: match.level,
      reasons: match.reason
    }));

    res.json({
      studentId,
      subject: topMatches[0]?.subject || 'reading',
      level: topMatches[0]?.level || 'Beginner',
      suggestions: topMatches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Assign Tutor/Parent to student
exports.assignStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { tutorId, parentId } = req.body;

    const student = await Student.findByIdAndUpdate(
      studentId,
      { tutorId: tutorId || null, parentId: parentId || null },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Student Learning Levels
exports.updateStudentLevels = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reading, math } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const learningLevel = { ...student.learningLevel };
    if (reading) learningLevel.reading = reading;
    if (math) learningLevel.math = math;

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { learningLevel },
      { new: true }
    );

    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// Tutor Session Logs
// ========================================================

// Get Session Logs
exports.getSessionLogs = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'tutor') {
      query = { tutorId: req.user.id };
    }
    const logs = await SessionLog.find(query).populate('tutorId studentId');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Session Log
exports.createSessionLog = async (req, res) => {
  try {
    const { studentId, date, subject, duration, topicsCovered, observations } = req.body;

    if (!studentId || !subject || !duration) {
      return res.status(400).json({ error: 'Missing required session log fields' });
    }

    const log = await SessionLog.create({
      tutorId: req.user.id,
      studentId,
      date: date || new Date(),
      subject,
      duration,
      topicsCovered,
      observations
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// Consent Management
// ========================================================

// Get consent status for a parent/student pair
exports.getConsent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const parentId = req.user.id;

    let consent = await Consent.findOne({ parentId, studentId });
    if (!consent) {
      // Return a default unsigned state
      consent = { parentId, studentId, signed: false };
    }
    res.json(consent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit Consent Form
exports.submitConsent = async (req, res) => {
  try {
    const { studentId, signed, parentSignatureText } = req.body;
    const parentId = req.user.id;

    if (!studentId || signed === undefined) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    let consent = await Consent.findOne({ parentId, studentId });
    if (consent) {
      consent = await Consent.findByIdAndUpdate(
        consent._id,
        { signed, parentSignatureText, signedAt: new Date() },
        { new: true }
      );
    } else {
      consent = await Consent.create({
        parentId,
        studentId,
        signed,
        parentSignatureText,
        signedAt: new Date()
      });
    }

    res.json(consent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// Weekend Check-ins (Quiz & Feedback)
// ========================================================

// Get Weekend Check-Ins
exports.getWeekendCheckIns = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'parent') {
      query = { parentId: req.user.id };
    }
    const checkins = await WeekendCheckIn.find(query).populate('parentId studentId');
    res.json(checkins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit Weekend Check-In
exports.submitWeekendCheckIn = async (req, res) => {
  try {
    const { studentId, weekEndDate, quizResults, parentFeedback } = req.body;
    const parentId = req.user.id;

    if (!studentId || !quizResults || !parentFeedback) {
      return res.status(400).json({ error: 'Missing check-in data' });
    }

    // Verify parent has consent for this child first
    const consent = await Consent.findOne({ parentId, studentId });
    if (!consent || !consent.signed) {
      return res.status(403).json({ error: 'Consent form must be signed prior to check-in.' });
    }

    const checkIn = await WeekendCheckIn.create({
      parentId,
      studentId,
      weekEndDate: weekEndDate || new Date(),
      quizResults,
      parentFeedback,
      status: 'completed'
    });

    res.status(201).json(checkIn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// Session Guides (activities per level)
// ========================================================

const VALID_LEVELS = {
  reading: ['Beginner', 'Letter', 'Word', 'Paragraph', 'Story'],
  math: ['Beginner', 'Number', 'Addition', 'Subtraction', 'Division']
};

exports.getSessionGuides = async (req, res) => {
  try {
    const { subject, level } = req.query;
    const query = {};
    if (subject) query.subject = subject;
    if (level) query.level = level;

    const guides = await SessionGuide.find(query);
    res.json(guides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSessionGuide = async (req, res) => {
  try {
    const { subject, level } = req.params;
    const { activities } = req.body;

    if (!VALID_LEVELS[subject] || !VALID_LEVELS[subject].includes(level)) {
      return res.status(400).json({ error: 'Invalid subject or level' });
    }

    if (!Array.isArray(activities) || activities.length < 2 || activities.length > 3) {
      return res.status(400).json({ error: 'Provide 2 or 3 activities' });
    }

    const cleaned = activities.map((a) => ({
      title: String(a.title || '').trim(),
      description: String(a.description || '').trim()
    }));

    if (cleaned.some((a) => !a.title || !a.description)) {
      return res.status(400).json({ error: 'Each activity needs a title and description' });
    }

    let guide = await SessionGuide.findOne({ subject, level });
    if (guide) {
      guide = await SessionGuide.findByIdAndUpdate(
        guide._id,
        { activities: cleaned },
        { new: true }
      );
    } else {
      guide = await SessionGuide.create({ subject, level, activities: cleaned });
    }

    res.json(guide);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// Dashboard Statistics (Coordinators)
// ========================================================

exports.getStats = async (req, res) => {
  try {
    const students = await Student.find({});
    const tutors = await User.find({ role: 'tutor' });
    const parents = await User.find({ role: 'parent' });
    const sessionLogs = await SessionLog.find({});
    const checkins = await WeekendCheckIn.find({});

    // Count statistics
    const totalStudents = students.length;
    const totalTutors = tutors.length;
    const totalParents = parents.length;
    const totalSessions = sessionLogs.length;

    // Calculate progression details (reading vs math)
    const levelCounts = {
      reading: { Beginner: 0, Letter: 0, Word: 0, Paragraph: 0, Story: 0 },
      math: { Beginner: 0, Number: 0, Addition: 0, Subtraction: 0, Division: 0 }
    };

    students.forEach(s => {
      const rl = s.learningLevel?.reading || 'Beginner';
      const ml = s.learningLevel?.math || 'Beginner';
      if (levelCounts.reading[rl] !== undefined) levelCounts.reading[rl]++;
      if (levelCounts.math[ml] !== undefined) levelCounts.math[ml]++;
    });

    res.json({
      counts: {
        students: totalStudents,
        tutors: totalTutors,
        parents: totalParents,
        sessions: totalSessions,
        checkins: checkins.length
      },
      levels: levelCounts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
