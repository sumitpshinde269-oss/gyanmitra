/**
 * GyanMitra demo data seeder.
 * Ensures coordinator / tutor1 / parent1 always exist with known passwords.
 *
 * Usage:
 *   node seed.js
 *   npm run seed
 *
 * Also imported by index.js on server startup.
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDB, getIsMock } = require('./config/db');

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'password123';
const SCHOOL_NAME = 'Govt. Primary School, Rampur';

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

const DEMO_USERS = [
  {
    username: 'coordinator',
    role: 'coordinator',
    name: 'Amit Patel',
    phone: '9876543210'
  },
  {
    username: 'tutor1',
    role: 'tutor',
    name: 'Priya Sharma',
    phone: '8765432109',
    expertise: ['reading:Word', 'reading:Paragraph', 'math:Number'],
    tutorStatus: 'active'
  },
  {
    username: 'parent1',
    role: 'parent',
    name: 'Rajesh Kumar',
    phone: '7654321098'
  }
];

async function ensureDemoUser(User, hashedPassword, spec) {
  const existing = await User.findOne({ username: spec.username });
  if (existing) {
    const updates = {
      password: hashedPassword,
      role: spec.role,
      name: spec.name,
      phone: spec.phone,
      schoolName: SCHOOL_NAME
    };
    if (spec.role === 'tutor') {
      updates.tutorStatus = existing.tutorStatus || spec.tutorStatus || 'active';
      updates.expertise = spec.expertise || existing.expertise || ['reading:Word', 'math:Number'];
    }
    const updated = await User.findByIdAndUpdate(existing._id, updates);
    return updated;
  }

  return User.create({
    username: spec.username,
    password: hashedPassword,
    role: spec.role,
    name: spec.name,
    phone: spec.phone,
    schoolName: SCHOOL_NAME,
    ...(spec.tutorStatus ? { tutorStatus: spec.tutorStatus } : {}),
    ...(spec.expertise ? { expertise: spec.expertise } : {})
  });
}

async function seedDatabase() {
  const { User, Student, Consent, SessionGuide, TeachingMaterial } = require('./models');

  console.log('Running GyanMitra seed...');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, salt);

  // Always ensure the three demo login accounts exist with the known password
  const usersByKey = {};
  for (const spec of DEMO_USERS) {
    const user = await ensureDemoUser(User, hashedPassword, spec);
    usersByKey[spec.username] = user;
    console.log(`  ✓ Demo account ready: ${spec.username} (${spec.role})`);
  }

  const coordinator = usersByKey.coordinator;
  const tutor = usersByKey.tutor1;
  const parent = usersByKey.parent1;

  // Session guides (only if none)
  const existingGuides = await SessionGuide.find({});
  if (existingGuides.length === 0) {
    for (const guide of DEFAULT_SESSION_GUIDES) {
      await SessionGuide.create(guide);
    }
    console.log(`  ✓ Seeded ${DEFAULT_SESSION_GUIDES.length} session guides`);
  }

  // Demo students (create if missing by name)
  let students = await Student.find({});
  let aarav = students.find((s) => s.name === 'Aarav Kumar');
  let jyoti = students.find((s) => s.name === 'Jyoti Kumari');

  if (!aarav) {
    aarav = await Student.create({
      name: 'Aarav Kumar',
      grade: 4,
      tutorId: tutor._id,
      parentId: parent._id,
      learningLevel: { reading: 'Letter', math: 'Number' },
      schoolName: SCHOOL_NAME
    });
    console.log('  ✓ Created student: Aarav Kumar');
  } else {
    // Keep demo links intact for reliable role demos
    await Student.findByIdAndUpdate(aarav._id, {
      tutorId: tutor._id,
      parentId: parent._id
    });
  }

  if (!jyoti) {
    jyoti = await Student.create({
      name: 'Jyoti Kumari',
      grade: 3,
      tutorId: null,
      parentId: null,
      learningLevel: { reading: 'Beginner', math: 'Beginner' },
      schoolName: SCHOOL_NAME
    });
    console.log('  ✓ Created student: Jyoti Kumari');
  }

  // Pre-signed consent for parent check-in demo
  const consent = await Consent.findOne({ parentId: parent._id, studentId: aarav._id });
  if (!consent) {
    await Consent.create({
      parentId: parent._id,
      studentId: aarav._id,
      signed: true,
      signedAt: new Date(),
      parentSignatureText: 'Rajesh Kumar'
    });
    console.log('  ✓ Created signed consent for Aarav Kumar');
  }

  const defaultMaterials = [
    {
      title: 'Grade 3 Reading Lesson Plan: Word Families',
      type: 'lesson_plan',
      subject: 'reading',
      grade: 'Grade 3',
      description: 'Short, structured reading lesson with warm-up, practice, and exit task.',
      content: '1. Warm-up: sound matching round.\n2. Teach: short word families (at, an, in).\n3. Practice: read 8 words aloud.\n4. Assessment: ask student to read 5 words without help.\n5. Wrap-up: ask one comprehension question.'
    },
    {
      title: 'Grade 4 Math Worksheet: Addition and Subtraction',
      type: 'worksheet',
      subject: 'math',
      grade: 'Grade 4',
      description: 'Practice sheet with simple addition and subtraction problems.',
      content: 'A. 12 + 5 = ___\nB. 18 - 7 = ___\nC. 25 + 10 = ___\nD. 30 - 12 = ___\nE. 9 + 8 = ___'
    },
    {
      title: 'Assessment Template: Reading Fluency Check',
      type: 'assessment',
      subject: 'reading',
      grade: 'Grade 5',
      description: 'Quick fluency assessment checklist for tutors.',
      content: 'Student reads aloud 3 short sentences.\n- Accuracy: ___/10\n- Confidence: 1-5\n- Hesitation issues: ___\n- Comprehension question: ___\n- Next action: ___'
    },
    {
      title: 'Teaching Tip: Use Praise and Slow Correction',
      type: 'teaching_tip',
      subject: 'general',
      grade: 'All grades',
      description: 'Simple teaching reminder to keep sessions calm and encouraging.',
      content: 'Give one clear instruction at a time. Praise effort before correction. If the student struggles, model once, then let them try again. Keep the pace slow and positive.'
    }
  ];

  const existingMaterials = await TeachingMaterial.find({});
  if (existingMaterials.length === 0) {
    for (const item of defaultMaterials) {
      await TeachingMaterial.create({
        ...item,
        createdBy: coordinator._id
      });
    }
    console.log('  ✓ Seeded teaching materials library');
  }

  console.log('Seed complete. Demo logins (password: ' + DEMO_PASSWORD + '):');
  console.log('  coordinator | tutor1 | parent1');

  return { coordinator, tutor, parent, aarav, jyoti };
}

async function runCli() {
  try {
    await connectDB();
    await seedDatabase();

    if (getIsMock()) {
      console.log('Note: using JSON mock DB — data persisted under server/data/db.json');
    } else if ((process.env.MONGODB_URI || '').includes('memory') || !process.env.MONGODB_URI) {
      console.log('Note: if the server uses in-memory MongoDB, run seed via server startup (npm run dev) so data stays loaded.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = { seedDatabase, DEMO_PASSWORD, DEMO_USERS };
