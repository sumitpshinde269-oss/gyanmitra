import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ParentCheckIn() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [consentStatus, setConsentStatus] = useState(null);
  const [pastCheckIns, setPastCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quiz / Check-in State
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkinSubject, setCheckinSubject] = useState('reading');
  const [quizStep, setQuizStep] = useState(0); // 0: Start, 1: Q1, 2: Q2, 3: Q3, 4: Feedback
  const [quizScore, setQuizScore] = useState(0);
  const [feedbackConfidence, setFeedbackConfidence] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchParentData();
  }, []);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const studentsRes = await axios.get('/api/students');
      setStudents(studentsRes.data);

      if (studentsRes.data.length > 0) {
        const firstStudent = studentsRes.data[0];
        setSelectedStudent(firstStudent);
        await checkConsentAndLoadHistory(firstStudent._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const checkConsentAndLoadHistory = async (studentId) => {
    try {
      const [consentRes, checkinsRes] = await Promise.all([
        axios.get(`/api/consent/${studentId}`),
        axios.get('/api/weekend-checkins')
      ]);

      setConsentStatus(consentRes.data);
      
      // Filter past check-ins for the selected student
      const studentHistory = checkinsRes.data.filter(c => 
        (c.studentId?._id || c.studentId) === studentId
      );
      setPastCheckIns(studentHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = async (e) => {
    setLoading(true);
    const student = students.find(s => s._id === e.target.value);
    setSelectedStudent(student);
    setIsCheckingIn(false);
    setQuizStep(0);
    setQuizScore(0);
    await checkConsentAndLoadHistory(student._id);
  };

  // Simple static quiz question generators based on learning level
  const getQuizQuestions = (subject, level) => {
    const readingQuestions = {
      Beginner: [
        { text: 'Ask your child to read this sound: "A"', answer: 'A' },
        { text: 'Ask your child to read this sound: "M"', answer: 'M' },
        { text: 'Ask your child to read this sound: "T"', answer: 'T' }
      ],
      Letter: [
        { text: 'Ask your child to read this alphabet: "R"', answer: 'R' },
        { text: 'Ask your child to read this alphabet: "G"', answer: 'G' },
        { text: 'Ask your child to read this alphabet: "Y"', answer: 'Y' }
      ],
      Word: [
        { text: 'Ask your child to read this word: "CAT"', answer: 'CAT' },
        { text: 'Ask your child to read this word: "HOME"', answer: 'HOME' },
        { text: 'Ask your child to read this word: "BOOK"', answer: 'BOOK' }
      ],
      Paragraph: [
        { text: 'Ask your child to read: "Ram goes home. He fills water from the tap."', answer: 'Ram goes home...' },
        { text: 'Ask your child to read: "This is my dog. It runs very fast."', answer: 'This is my dog...' },
        { text: 'Ask your child to read: "The sky is clear today. The sun is shining."', answer: 'The sky is clear...' }
      ],
      Story: [
        { text: 'Ask your child to read: "A lion lived in a forest. He was very strong. All animals feared him. One day a small ant saved his life."', answer: 'Story reading' },
        { text: 'Ask child: "Why did the animals fear the lion?"', answer: 'Because he was powerful' },
        { text: 'Ask child: "Who saved the lion?"', answer: 'The small ant' }
      ]
    };

    const mathQuestions = {
      Beginner: [
        { text: 'Ask your child to count these shapes: 🍎 🍎 🍎', answer: '3' },
        { text: 'Ask your child to count these shapes: ⭐ ⭐ ⭐ ⭐ ⭐', answer: '5' },
        { text: 'Ask your child to count these shapes: 🎈 🎈', answer: '2' }
      ],
      Number: [
        { text: 'Ask your child to read this number: "18"', answer: '18' },
        { text: 'Ask your child to read this number: "74"', answer: '74' },
        { text: 'Ask your child to read this number: "59"', answer: '59' }
      ],
      Addition: [
        { text: 'Ask child to solve: "4 + 3 = ?"', answer: '7' },
        { text: 'Ask child to solve: "12 + 6 = ?"', answer: '18' },
        { text: 'Ask child to solve: "25 + 10 = ?"', answer: '35' }
      ],
      Subtraction: [
        { text: 'Ask child to solve: "9 - 4 = ?"', answer: '5' },
        { text: 'Ask child to solve: "18 - 6 = ?"', answer: '12' },
        { text: 'Ask child to solve: "42 - 11 = ?"', answer: '31' }
      ],
      Division: [
        { text: 'Ask child to solve: "8 ÷ 2 = ?"', answer: '4' },
        { text: 'Ask child to solve: "15 ÷ 3 = ?"', answer: '5' },
        { text: 'Ask child to solve: "36 ÷ 6 = ?"', answer: '6' }
      ]
    };

    const subjectSet = subject === 'reading' ? readingQuestions : mathQuestions;
    return subjectSet[level] || subjectSet['Beginner'];
  };

  const currentLevel = selectedStudent
    ? (checkinSubject === 'reading' ? selectedStudent.learningLevel?.reading : selectedStudent.learningLevel?.math)
    : 'Beginner';

  const questions = selectedStudent ? getQuizQuestions(checkinSubject, currentLevel) : [];

  const handleAnswer = (correct) => {
    if (correct) {
      setQuizScore(prev => prev + 1);
    }
    setQuizStep(prev => prev + 1);
  };

  const handleStartCheckin = () => {
    setIsCheckingIn(true);
    setQuizStep(1);
    setQuizScore(0);
    setFeedbackComment('');
    setFeedbackConfidence(5);
  };

  const submitCheckIn = async () => {
    try {
      setSubmitting(true);
      await axios.post('/api/weekend-checkins', {
        studentId: selectedStudent._id,
        quizResults: {
          subject: checkinSubject,
          score: quizScore,
          total: 3
        },
        parentFeedback: {
          confidence: feedbackConfidence,
          comments: feedbackComment
        }
      });

      setIsCheckingIn(false);
      setQuizStep(0);
      await checkConsentAndLoadHistory(selectedStudent._id);
    } catch (error) {
      alert(error.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  const readingLadder = [
    { key: 'Beginner', label: 'Beginner' },
    { key: 'Letter', label: 'Letter' },
    { key: 'Word', label: 'Word' },
    { key: 'Paragraph', label: 'Paragraph' },
    { key: 'Story', label: 'Story' }
  ];
  const mathLadder = [
    { key: 'Beginner', label: 'Beginner' },
    { key: 'Number', label: 'Number' },
    { key: 'Addition', label: 'Add' },
    { key: 'Subtraction', label: 'Sub' },
    { key: 'Division', label: 'Div' }
  ];

  const renderLevelLadder = (steps, currentLevel) => (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, idx) => {
        const isCurrent = step.key === currentLevel;
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && <span className="text-slate-300 text-[10px] select-none">→</span>}
            <span
              className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                isCurrent
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {step.label}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      {/* Student Selector */}
      {students.length > 0 && (
        <div className="bg-white rounded border border-slate-200 p-5 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Child</label>
          <select
            value={selectedStudent?._id || ''}
            onChange={handleStudentSelect}
            className="w-full bg-white border border-slate-200 rounded p-3 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
          >
            {students.map(s => (
              <option key={s._id} value={s._id}>{s.name} (Grade {s.grade})</option>
            ))}
          </select>
        </div>
      )}

      {students.length === 0 ? (
        <div className="bg-white rounded border border-slate-200 p-8 text-center">
          <p className="text-slate-500 text-sm">No children linked to your parent account.</p>
        </div>
      ) : !consentStatus?.signed ? (
        /* Redirection prompt to sign Consent first */
        <div className="bg-white rounded border border-slate-200 p-6 text-center space-y-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Consent Form Required</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            You must sign the digital consent checklist for <strong>{selectedStudent.name}</strong> before logging weekend check-ins.
          </p>
          <button
            onClick={() => navigate('/consent', { state: { studentId: selectedStudent._id } })}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded text-xs uppercase tracking-wider transition"
          >
            Go to Consent Form
          </button>
        </div>
      ) : (
        /* Parent Check-In Panel */
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="border-b border-slate-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Weekend Check-in</h2>
                <p className="text-xs text-slate-400 mt-1">Sit with your child for a quick check</p>
              </div>
              <span className="border border-slate-200 text-slate-500 text-[10px] px-2.5 py-1 rounded font-semibold uppercase tracking-wider bg-slate-50">
                Consent Active
              </span>
            </div>

            <div className="p-6">
              {!isCheckingIn ? (
                /* Landing screen */
                <div className="space-y-6">
                  {/* Current Learning Levels — ladder */}
                  <div className="space-y-5">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Learning Levels</h3>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-700">Reading</p>
                      {renderLevelLadder(readingLadder, selectedStudent.learningLevel?.reading || 'Beginner')}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-700">Math</p>
                      {renderLevelLadder(mathLadder, selectedStudent.learningLevel?.math || 'Beginner')}
                    </div>
                  </div>

                  {/* Start Check-in Action */}
                  <div className="border-t border-slate-150 pt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Check-in Subject</label>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => setCheckinSubject('reading')}
                          className={`flex-1 py-3 px-4 rounded text-xs uppercase tracking-wider font-semibold border transition ${
                            checkinSubject === 'reading'
                              ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          Reading Check
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckinSubject('math')}
                          className={`flex-1 py-3 px-4 rounded text-xs uppercase tracking-wider font-semibold border transition ${
                            checkinSubject === 'math'
                              ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          Math Check
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleStartCheckin}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded text-xs uppercase tracking-wider shadow transition"
                    >
                      Start Weekly Quiz
                    </button>
                  </div>
                </div>
              ) : (
                /* Interactive Quiz Flow */
                <div className="space-y-6">
                  {/* Quiz Steps (Questions 1, 2, 3) */}
                  {quizStep >= 1 && quizStep <= 3 && (
                    <div className="space-y-6 py-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <span>Subject: {checkinSubject === 'reading' ? 'Reading' : 'Math'} ({currentLevel})</span>
                        <span>Question {quizStep} of 3</span>
                      </div>

                      <div className="border border-slate-200 p-6 rounded text-center space-y-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Show the screen to your child and ask:</p>
                        <p className="text-2xl font-bold text-slate-900 tracking-wide select-none">
                          {questions[quizStep - 1]?.text}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <button
                          onClick={() => handleAnswer(false)}
                          className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded text-xs uppercase tracking-wider transition"
                        >
                          Incorrect
                        </button>
                        <button
                          onClick={() => handleAnswer(true)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded text-xs uppercase tracking-wider transition"
                        >
                          Correct
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback Form (Step 4) */}
                  {quizStep === 4 && (
                    <div className="space-y-6">
                      <div className="text-center py-2">
                        <h4 className="text-base font-bold text-slate-900 uppercase tracking-wider">Quiz Completed</h4>
                        <p className="text-xs text-slate-450 mt-1">Score: <strong className="text-slate-900 text-sm font-semibold">{quizScore} / 3</strong></p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-150">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Your Confidence Rating
                          </label>
                          <div className="flex space-x-3 justify-center py-2">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setFeedbackConfidence(val)}
                                className={`w-11 h-11 rounded border font-semibold text-sm transition ${
                                  val <= feedbackConfidence
                                    ? 'bg-slate-900 border-slate-900 text-white'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                          <p className="text-center text-[10px] text-slate-400 uppercase tracking-wider mt-2">
                            {feedbackConfidence === 5 && 'Excellent progress'}
                            {feedbackConfidence === 4 && 'Good progress'}
                            {feedbackConfidence === 3 && 'Average progress'}
                            {feedbackConfidence === 2 && 'Needs more work'}
                            {feedbackConfidence === 1 && 'Struggling'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Remarks
                          </label>
                          <textarea
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            placeholder="Share observations with the coordinator..."
                            className="w-full px-4 py-3 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950 h-24"
                          ></textarea>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setQuizStep(0)}
                          className="w-1/3 border border-slate-200 text-slate-650 py-3 rounded text-xs uppercase tracking-wider font-semibold hover:bg-slate-50 transition"
                        >
                          Restart
                        </button>
                        <button
                          onClick={submitCheckIn}
                          disabled={submitting}
                          className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded text-xs uppercase tracking-wider transition disabled:opacity-50"
                        >
                          {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Past Check-ins History */}
          <div className="bg-white rounded border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Past Weekend Check-ins</h3>
            {pastCheckIns.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No check-ins completed yet.</p>
            ) : (
              <div className="space-y-3">
                {pastCheckIns.map(c => (
                  <div key={c._id} className="flex justify-between items-center bg-slate-50 p-4 rounded border border-slate-200 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 uppercase tracking-wider">
                        {c.quizResults?.subject} Check
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">Score: {c.quizResults?.score}/3</p>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">
                        Confidence: {c.parentFeedback?.confidence}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentCheckIn;
