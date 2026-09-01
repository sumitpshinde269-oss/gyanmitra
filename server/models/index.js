const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { getIsMock, dbFilePath } = require('../config/db');

// Helper to read/write Mock DB
const readJSON = () => {
  try {
    return JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
  } catch (e) {
    return { users: [], students: [], sessionLogs: [], weekendCheckIns: [], consents: [], sessionGuides: [] };
  }
};

const writeJSON = (data) => {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
};

// ----------------------------------------------------
// 1. Mongoose Schemas & Models (For MongoDB mode)
// ----------------------------------------------------

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['coordinator', 'school_admin', 'parent', 'tutor'] },
  name: { type: String, required: true },
  phone: String,
  schoolName: String,
  expertise: [{ type: String }],
  tutorStatus: { type: String, enum: ['active', 'on_break'], default: 'active' }
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grade: { type: Number, required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  learningLevel: {
    reading: { type: String, default: 'Beginner', enum: ['Beginner', 'Letter', 'Word', 'Paragraph', 'Story'] },
    math: { type: String, default: 'Beginner', enum: ['Beginner', 'Number', 'Addition', 'Subtraction', 'Division'] }
  },
  schoolName: String
}, { timestamps: true });

const sessionLogSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, default: Date.now },
  subject: { type: String, required: true, enum: ['reading', 'math'] },
  duration: { type: Number, required: true }, // in minutes
  topicsCovered: String,
  observations: String
}, { timestamps: true });

const weekendCheckInSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  weekEndDate: { type: Date, required: true },
  quizResults: {
    subject: { type: String, required: true, enum: ['reading', 'math'] },
    score: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  parentFeedback: {
    confidence: { type: Number, required: true }, // 1-5 rating
    comments: String
  },
  status: { type: String, default: 'completed' }
}, { timestamps: true });

const consentSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  signed: { type: Boolean, default: false },
  signedAt: Date,
  parentSignatureText: String
}, { timestamps: true });

const sessionGuideSchema = new mongoose.Schema({
  subject: { type: String, required: true, enum: ['reading', 'math'] },
  level: { type: String, required: true },
  activities: [{
    title: { type: String, required: true },
    description: { type: String, required: true }
  }]
}, { timestamps: true });

sessionGuideSchema.index({ subject: 1, level: 1 }, { unique: true });

const MongoUser = mongoose.model('User', userSchema);
const MongoStudent = mongoose.model('Student', studentSchema);
const MongoSessionLog = mongoose.model('SessionLog', sessionLogSchema);
const MongoWeekendCheckIn = mongoose.model('WeekendCheckIn', weekendCheckInSchema);
const MongoConsent = mongoose.model('Consent', consentSchema);
const MongoSessionGuide = mongoose.model('SessionGuide', sessionGuideSchema);

// ----------------------------------------------------
// 2. Query Builder Mock for Populating (For Mock mode)
// ----------------------------------------------------

class MockQuery {
  constructor(data, collectionName, results, isArray = true) {
    this.data = data;
    this.collectionName = collectionName;
    this.results = results;
    this.isArray = isArray;
  }

  populate(pathStr) {
    if (!this.results) return this;
    const paths = pathStr.split(' ');

    const populateItem = (item) => {
      const newItem = { ...item };
      paths.forEach(p => {
        if (p === 'tutorId' || p === 'parentId') {
          const user = this.data.users.find(u => String(u._id) === String(newItem[p]));
          if (user) {
            const { password, ...safeUser } = user;
            newItem[p] = safeUser;
          } else {
            newItem[p] = null; // Reference not found
          }
        } else if (p === 'studentId') {
          const student = this.data.students.find(s => String(s._id) === String(newItem[p]));
          if (student) {
            newItem[p] = student;
          } else {
            newItem[p] = null;
          }
        }
      });
      return newItem;
    };

    if (this.isArray) {
      this.results = this.results.map(populateItem);
    } else {
      this.results = populateItem(this.results);
    }

    return this;
  }

  then(onfulfilled, onrejected) {
    return Promise.resolve(this.results).then(onfulfilled, onrejected);
  }
}

// ----------------------------------------------------
// 3. Unified Model Wrapper (Abstracts Mongoose/JSON)
// ----------------------------------------------------

function createModelWrapper(collectionName, mongooseModel) {
  return {
    find: (query = {}) => {
      if (!getIsMock()) {
        return mongooseModel.find(query);
      }
      const data = readJSON();
      const items = data[collectionName] || [];
      const filtered = items.filter(item => {
        for (let key in query) {
          if (query[key] !== undefined) {
            // handle simple nested object check, e.g. parentId
            if (String(item[key]) !== String(query[key])) {
              return false;
            }
          }
        }
        return true;
      });
      return new MockQuery(data, collectionName, filtered, true);
    },

    findOne: (query = {}) => {
      if (!getIsMock()) {
        return mongooseModel.findOne(query);
      }
      const data = readJSON();
      const items = data[collectionName] || [];
      const found = items.find(item => {
        for (let key in query) {
          if (query[key] !== undefined) {
            if (String(item[key]) !== String(query[key])) {
              return false;
            }
          }
        }
        return true;
      });
      return new MockQuery(data, collectionName, found || null, false);
    },

    findById: (id) => {
      if (!getIsMock()) {
        return mongooseModel.findById(id);
      }
      const data = readJSON();
      const items = data[collectionName] || [];
      const found = items.find(item => String(item._id) === String(id));
      return new MockQuery(data, collectionName, found || null, false);
    },

    create: async (docData) => {
      if (!getIsMock()) {
        return mongooseModel.create(docData);
      }
      const data = readJSON();
      if (!data[collectionName]) {
        data[collectionName] = [];
      }
      const newItem = {
        _id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...docData
      };
      
      // Default level for students
      if (collectionName === 'students' && !newItem.learningLevel) {
        newItem.learningLevel = { reading: 'Beginner', math: 'Beginner' };
      }
      // Default tutor status
      if (collectionName === 'users' && newItem.role === 'tutor' && !newItem.tutorStatus) {
        newItem.tutorStatus = 'active';
      }

      data[collectionName].push(newItem);
      writeJSON(data);
      return newItem;
    },

    findByIdAndUpdate: async (id, updateData, options = {}) => {
      if (!getIsMock()) {
        return mongooseModel.findByIdAndUpdate(id, updateData, { new: true, ...options });
      }
      const data = readJSON();
      const items = data[collectionName] || [];
      const idx = items.findIndex(item => String(item._id) === String(id));
      if (idx === -1) return null;

      // Handle nested fields like learningLevel
      const currentItem = items[idx];
      const mergedUpdate = { ...updateData };
      if (updateData.learningLevel) {
        mergedUpdate.learningLevel = {
          ...currentItem.learningLevel,
          ...updateData.learningLevel
        };
      }

      items[idx] = {
        ...currentItem,
        ...mergedUpdate,
        updatedAt: new Date().toISOString()
      };
      data[collectionName] = items;
      writeJSON(data);
      return items[idx];
    },

    deleteOne: async (query = {}) => {
      if (!getIsMock()) {
        return mongooseModel.deleteOne(query);
      }
      const data = readJSON();
      const items = data[collectionName] || [];
      const idx = items.findIndex(item => {
        for (let key in query) {
          if (query[key] !== undefined && String(item[key]) !== String(query[key])) {
            return false;
          }
        }
        return true;
      });
      if (idx !== -1) {
        items.splice(idx, 1);
        data[collectionName] = items;
        writeJSON(data);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    }
  };
}

module.exports = {
  User: createModelWrapper('users', MongoUser),
  Student: createModelWrapper('students', MongoStudent),
  SessionLog: createModelWrapper('sessionLogs', MongoSessionLog),
  WeekendCheckIn: createModelWrapper('weekendCheckIns', MongoWeekendCheckIn),
  Consent: createModelWrapper('consents', MongoConsent),
  SessionGuide: createModelWrapper('sessionGuides', MongoSessionGuide)
};
