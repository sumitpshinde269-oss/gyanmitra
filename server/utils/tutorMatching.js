const READING_LEVELS = ['Beginner', 'Letter', 'Word', 'Paragraph', 'Story'];
const MATH_LEVELS = ['Beginner', 'Number', 'Addition', 'Subtraction', 'Division'];

const normalizeLevel = (subject, level) => {
  const levels = subject === 'reading' ? READING_LEVELS : MATH_LEVELS;
  return levels.indexOf(level || 'Beginner');
};

const parseTutorExpertise = (expertise = []) => {
  const map = {};

  expertise.forEach((entry) => {
    if (!entry) return;
    const [subject, level] = String(entry).split(':');
    if (subject && level) {
      map[`${subject}:${level}`] = true;
      map[subject] = true;
    }
  });

  return map;
};

const getSubjectGap = (student) => {
  const reading = student?.learningLevel?.reading || 'Beginner';
  const math = student?.learningLevel?.math || 'Beginner';

  const readingGap = normalizeLevel('reading', reading);
  const mathGap = normalizeLevel('math', math);

  if (readingGap > mathGap) {
    return { subject: 'reading', level: reading };
  }

  if (mathGap > readingGap) {
    return { subject: 'math', level: math };
  }

  return { subject: 'reading', level: reading };
};

const getTutorSuccessRate = (tutorId, sessionLogs, subject, level) => {
  if (!sessionLogs || !sessionLogs.length) {
    return 0.5;
  }

  const relevant = sessionLogs.filter((log) => {
    const sameTutor = String(log.tutorId) === String(tutorId);
    const sameSubject = log.subject === subject;
    return sameTutor && sameSubject;
  });

  if (!relevant.length) {
    return 0.5;
  }

  const avgDuration = relevant.reduce((sum, log) => sum + (log.duration || 0), 0) / relevant.length;
  return Math.min(1, avgDuration / 60);
};

const suggestTutorsForStudent = (student, tutors = [], sessionLogs = [], workloadMap = {}) => {
  const { subject, level } = getSubjectGap(student);
  const validTutors = tutors.filter((tutor) => tutor.tutorStatus === 'active');

  const ranked = validTutors.map((tutor) => {
    const expertiseMap = parseTutorExpertise(tutor.expertise || []);
    const exactMatch = expertiseMap[`${subject}:${level}`] ? 1 : 0;
    const subjectMatch = expertiseMap[subject] ? 1 : 0;
    const workload = workloadMap[String(tutor._id)] || 0;
    const workloadScore = Math.max(0, 1 - workload / 4);
    const successRate = getTutorSuccessRate(tutor._id, sessionLogs, subject, level);

    let gapFit = 0.35;
    if (exactMatch) {
      gapFit = 1;
    } else if (subjectMatch) {
      gapFit = 0.75;
    }

    const expertiseScore = exactMatch ? 1 : subjectMatch ? 0.75 : 0.5;
    const score = (0.4 * gapFit) + (0.25 * expertiseScore) + (0.2 * workloadScore) + (0.15 * successRate);

    return {
      tutor,
      subject,
      level,
      score: Number(score.toFixed(3)),
      reason: {
        gapFit,
        expertiseScore,
        workloadScore,
        successRate
      }
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
};

module.exports = {
  suggestTutorsForStudent,
  getSubjectGap
};
