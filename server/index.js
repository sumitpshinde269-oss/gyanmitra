const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Register API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Database seeding logic
const seedData = async () => {
  try {
    const { User, Student, Consent } = require('./models');
    const bcrypt = require('bcryptjs');

    // Check if database is empty
    const users = await User.find({});
    if (users.length > 0) {
      console.log('Users already present in database. Skipping data seeding.');
      return;
    }

    console.log('Seeding initial demo data...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create a Coordinator
    const coordinator = await User.create({
      username: 'coordinator',
      password: hashedPassword,
      role: 'coordinator',
      name: 'Amit Patel',
      phone: '9876543210',
      schoolName: 'Govt. Primary School, Rampur'
    });

    // Create a Tutor (Senior student 10th grade)
    const tutor = await User.create({
      username: 'tutor1',
      password: hashedPassword,
      role: 'tutor',
      name: 'Priya Sharma',
      phone: '8765432109',
      schoolName: 'Govt. Primary School, Rampur'
    });

    // Create a Parent
    const parent = await User.create({
      username: 'parent1',
      password: hashedPassword,
      role: 'parent',
      name: 'Rajesh Kumar',
      phone: '7654321098',
      schoolName: 'Govt. Primary School, Rampur'
    });

    // Create Students
    // Student 1: Assigned to Priya (Tutor) and Rajesh (Parent)
    const student1 = await Student.create({
      name: 'Aarav Kumar',
      grade: 4,
      tutorId: tutor._id,
      parentId: parent._id,
      learningLevel: { reading: 'Letter', math: 'Number' },
      schoolName: 'Govt. Primary School, Rampur'
    });

    // Student 2: Unassigned, for testing coordinator assignment flows
    const student2 = await Student.create({
      name: 'Jyoti Kumari',
      grade: 3,
      tutorId: null,
      parentId: null,
      learningLevel: { reading: 'Beginner', math: 'Beginner' },
      schoolName: 'Govt. Primary School, Rampur'
    });

    // Pre-sign consent for Aarav Kumar (so parents can jump straight to check-in)
    await Consent.create({
      parentId: parent._id,
      studentId: student1._id,
      signed: true,
      signedAt: new Date(),
      parentSignatureText: 'Rajesh Kumar'
    });

    console.log('Seeded database successfully with demo accounts:');
    console.log('  Coordinator: username "coordinator", password "password123"');
    console.log('  Tutor:       username "tutor1",       password "password123"');
    console.log('  Parent:      username "parent1",      password "password123"');
    console.log('  Students:    "Aarav Kumar" (assigned), "Jyoti Kumari" (unassigned)');
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
};

// Start Server
async function startServer() {
  await connectDB();
  await seedData();
  
  app.listen(PORT, () => {
    console.log(`GyanMitra backend server running on http://localhost:${PORT}`);
  });
}

startServer();
