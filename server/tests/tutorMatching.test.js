const assert = require('assert');
const { suggestTutorsForStudent } = require('../utils/tutorMatching');

const student = {
  name: 'Aarav',
  learningLevel: { reading: 'Word', math: 'Number' }
};

const tutors = [
  {
    _id: 't1',
    name: 'Priya',
    tutorStatus: 'active',
    expertise: ['reading:Word', 'reading:Paragraph', 'math:Number'],
    sessionCount: 6
  },
  {
    _id: 't2',
    name: 'Rahul',
    tutorStatus: 'active',
    expertise: ['math:Subtraction', 'math:Division'],
    sessionCount: 2
  },
  {
    _id: 't3',
    name: 'Neha',
    tutorStatus: 'on_break',
    expertise: ['reading:Word'],
    sessionCount: 1
  }
];

const sessionLogs = [
  { tutorId: 't1', subject: 'reading', duration: 40, topicsCovered: 'word families' },
  { tutorId: 't1', subject: 'reading', duration: 50, topicsCovered: 'paragraph reading' },
  { tutorId: 't1', subject: 'reading', duration: 45, topicsCovered: 'word practice' },
  { tutorId: 't2', subject: 'math', duration: 30, topicsCovered: 'number drills' }
];

const ranked = suggestTutorsForStudent(student, tutors, sessionLogs, { t1: 2, t2: 1, t3: 4 });

assert.ok(ranked.length >= 2, 'Expected at least two valid tutor matches');
assert.equal(ranked[0].tutor.name, 'Priya', 'Expected Priya to rank first for a reading gap');
assert.ok(ranked.every((match) => match.tutor.tutorStatus === 'active'), 'Only active tutors should be recommended');
console.log('tutorMatching tests passed');
