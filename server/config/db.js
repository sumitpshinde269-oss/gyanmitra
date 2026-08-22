const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isMock = false;
const dbFilePath = path.join(__dirname, '../data/db.json');

// Ensure data folder and db.json exist
function initMockDB() {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify({
      users: [],
      students: [],
      sessionLogs: [],
      weekendCheckIns: [],
      consents: []
    }, null, 2));
    console.log('Initialized mock JSON database at', dbFilePath);
  }
}

async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gyanmitra';
  
  try {
    console.log('Attempting to connect to MongoDB...');
    // Set a short timeout (2 seconds) so it doesn't hang forever if MongoDB isn't running
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('MongoDB connected successfully!');
    isMock = false;
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to local JSON database storage...');
    initMockDB();
    isMock = true;
  }
}

function getIsMock() {
  return isMock;
}

module.exports = {
  connectDB,
  getIsMock,
  dbFilePath
};
