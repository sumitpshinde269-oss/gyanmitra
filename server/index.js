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

const DEFAULT_SESSION_GUIDES = [
  {
    subject: 'reading',
    level: 'Beginner',
    activities: [
      { title: 'Sound Match', description: 'Say 5 letter sounds slowly. Ask the student to clap when they hear each one correctly.' },
      { title: 'Trace & Say', description: 'Write 3 letters on paper. Student traces each letter while saying its sound aloud.' },
      { title: 'Picture Point', description: 'Show 4 simple pictures. Student points to the one that starts with the target letter sound.' }
    ]
  },
  {
    subject: 'reading',
    level: 'Letter',
    activities: [
      { title: 'Letter Flash', description: 'Show 8 letters one by one. Student names each letter. Note any that need practice.' },
      { title: 'Find the Letter', description: 'Write a short line of mixed letters. Student circles every instance of a target letter.' },
      { title: 'Letter Families', description: 'Group letters that look similar (b/d, p/q). Practice telling them apart for 5 minutes.' }
    ]
  },
  {
    subject: 'reading',
    level: 'Word',
    activities: [
      { title: 'Build Words', description: 'Use letter cards to build 5 simple 2–3 letter words. Student reads each word aloud.' },
      { title: 'Word Hunt', description: 'Write 6 familiar words. Student reads them, then underlines the first and last letter of each.' },
      { title: 'Slow to Fast', description: 'Student reads the same 4 words slowly, then again a little faster. Celebrate clear reading.' }
    ]
  },
  {
    subject: 'reading',
    level: 'Paragraph',
    activities: [
      { title: 'Read Aloud', description: 'Student reads a short 3–4 sentence paragraph. Pause after each sentence to check understanding.' },
      { title: 'Retell Briefly', description: 'After reading, student retells what happened in their own words in 2–3 sentences.' },
      { title: 'Find Key Words', description: 'Ask the student to underline 3 important words from the paragraph and explain why they matter.' }
    ]
  },
  {
    subject: 'reading',
    level: 'Story',
    activities: [
      { title: 'Story Read', description: 'Student reads a short story aloud. Help only when stuck for more than a few seconds.' },
      { title: 'Who & What', description: 'Ask: Who is in the story? What happened first? What happened at the end?' },
      { title: 'Predict Next', description: 'Stop near the end. Ask the student what might happen next and why.' }
    ]
  },
  {
    subject: 'math',
    level: 'Beginner',
    activities: [
      { title: 'Count Objects', description: 'Place 10 small items. Student counts them one by one while touching each object.' },
      { title: 'Make Groups', description: 'Ask student to make groups of 2, then 3, using pebbles or sticks.' },
      { title: 'More or Less', description: 'Show two small piles. Student says which has more and which has less.' }
    ]
  },
  {
    subject: 'math',
    level: 'Number',
    activities: [
      { title: 'Number Read', description: 'Write 8 numbers between 1 and 99. Student reads each number aloud.' },
      { title: 'Number Line', description: 'Draw a number line 1–20. Student places 5 given numbers in the correct spots.' },
      { title: 'Before & After', description: 'Say a number. Student says the number before and the number after.' }
    ]
  },
  {
    subject: 'math',
    level: 'Addition',
    activities: [
      { title: 'Add with Objects', description: 'Use objects to solve 5 simple additions (e.g. 3+2). Student shows the answer with items, then writes it.' },
      { title: 'Mental Sums', description: 'Ask 5 quick oral sums under 10. Praise correct answers; redo missed ones slowly.' },
      { title: 'Word Problem', description: 'Tell one short story problem involving addition. Student draws it, then writes the sum.' }
    ]
  },
  {
    subject: 'math',
    level: 'Subtraction',
    activities: [
      { title: 'Take Away', description: 'Start with 10 objects. Remove some. Student says how many remain for 5 rounds.' },
      { title: 'Written Subtract', description: 'Solve 5 written subtraction problems together. Check each step carefully.' },
      { title: 'Difference Check', description: 'After each answer, student adds back to check if the subtraction is correct.' }
    ]
  },
  {
    subject: 'math',
    level: 'Division',
    activities: [
      { title: 'Share Equally', description: 'Give 12 items. Student shares them equally among 2, then 3, then 4 friends.' },
      { title: 'Simple Quotients', description: 'Solve 5 easy division problems (e.g. 8÷2). Use drawings if needed.' },
      { title: 'Real Share Story', description: 'Create one short sharing story. Student writes the division and explains the answer.' }
    ]
  }
];

// Database seeding logic
const seedData = async () => {
  try {
    const { User, Student, Consent, SessionGuide } = require('./models');
    const bcrypt = require('bcryptjs');

    // Seed session guides if empty (independent of user seed)
    const existingGuides = await SessionGuide.find({});
    if (existingGuides.length === 0) {
      console.log('Seeding default session guides...');
      for (const guide of DEFAULT_SESSION_GUIDES) {
        await SessionGuide.create(guide);
      }
      console.log(`Seeded ${DEFAULT_SESSION_GUIDES.length} session guides.`);
    }

    // Check if database is empty
    const users = await User.find({});
    if (users.length > 0) {
      console.log('Users already present in database. Skipping user data seeding.');
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
      schoolName: 'Govt. Primary School, Rampur',
      tutorStatus: 'active'
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
