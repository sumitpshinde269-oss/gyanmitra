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
        { text: 'Ask your child to read this sound: "क" (ka)', answer: 'क' },
        { text: 'Ask your child to read this sound: "म" (ma)', answer: 'म' },
        { text: 'Ask your child to read this sound: "त" (ta)', answer: 'त' }
      ],
      Letter: [
        { text: 'Ask your child to read this alphabet: "R"', answer: 'R' },
        { text: 'Ask your child to read this alphabet: "G"', answer: 'G' },
        { text: 'Ask your child to read this alphabet: "Y"', answer: 'Y' }
      ],
      Word: [
        { text: 'Ask your child to read this word: "नल" (Tap)', answer: 'नल' },
        { text: 'Ask your child to read this word: "घर" (Home)', answer: 'घर' },
        { text: 'Ask your child to read this word: "आम" (Mango)', answer: 'आम' }
      ],
      Paragraph: [
        { text: 'Ask your child to read: "राम घर चल। नल पर पानी भर।"', answer: 'राम घर चल...' },
        { text: 'Ask your child to read: "यह मेरा कुत्ता है। यह बहुत तेज दौड़ता है।"', answer: 'यह मेरा कुत्ता...' },
        { text: 'Ask your child to read: "आज आसमान साफ है। सूरज चमक रहा है।"', answer: 'आज आसमान साफ...' }
      ],
      Story: [
        { text: 'Ask your child to read this short story: "एक जंगल में एक शेर रहता था। वह बहुत शक्तिशाली था। सभी जानवर उससे डरते थे। एक दिन एक छोटी चींटी ने उसकी जान बचाई।"', answer: 'Story reading' },
        { text: 'Ask child: "Why did the animals fear the lion?" (Sher se sabhi kyon darte the?)', answer: 'Because he was powerful' },
        { text: 'Ask child: "Who saved the lion?" (Sher ki jaan kisne bachayi?)', answer: 'The small ant' }
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
      <div class="flex items-center justify-center min-h-[50vh]">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Level Progression maps for styled progress meters
  const levelProgressMap = {
    reading: { Beginner: 10, Letter: 35, Word: 60, Paragraph: 80, Story: 100 },
    math: { Beginner: 10, Number: 35, Addition: 60, Subtraction: 80, Division: 100 }
  };

  return (
    <div class="max-w-md mx-auto space-y-4">
      {/* Student Selector */}
      {students.length > 0 && (
        <div class="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Select Child / बच्चा चुनें</label>
          <select
            value={selectedStudent?._id || ''}
            onChange={handleStudentSelect}
            class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {students.map(s => (
              <option key={s._id} value={s._id}>{s.name} (Grade {s.grade})</option>
            ))}
          </select>
        </div>
      )}

      {students.length === 0 ? (
        <div class="bg-white rounded-xl p-8 shadow border border-slate-100 text-center">
          <p class="text-slate-500">No children linked to your parent account.</p>
        </div>
      ) : !consentStatus?.signed ? (
        /* Redirection prompt to sign Consent first */
        <div class="bg-white rounded-2xl p-6 shadow-md border border-red-200 text-center space-y-4">
          <span class="text-5xl">📄</span>
          <h3 class="text-lg font-bold text-red-800">Consent Form Required</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            You must sign the digital consent checklist for <strong>{selectedStudent.name}</strong> before logging weekend checks.
          </p>
          <button
            onClick={() => navigate('/consent', { state: { studentId: selectedStudent._id } })}
            class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg transition"
          >
            Go to Consent Form
          </button>
        </div>
      ) : (
        /* Parent Check-In Panel */
        <div class="space-y-4">
          {/* Main Card */}
          <div class="bg-white rounded-2xl shadow-md border border-amber-100 overflow-hidden">
            {/* Header */}
            <div class="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white flex justify-between items-center">
              <div>
                <h2 class="text-lg font-bold">👨‍👩‍👦 Weekend Check-in</h2>
                <p class="text-xs text-amber-100">Sit with your child for a quick check</p>
              </div>
              <span class="bg-emerald-500/30 text-emerald-100 text-xs px-2 py-0.5 rounded font-bold border border-emerald-500/20">
                Consent Active
              </span>
            </div>

            <div class="p-5">
              {!isCheckingIn ? (
                /* Landing screen */
                <div class="space-y-5">
                  {/* Current Learning Levels */}
                  <div class="space-y-3">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Learning Levels</h3>
                    
                    {/* Reading Level bar */}
                    <div class="space-y-1">
                      <div class="flex justify-between text-xs font-semibold">
                        <span class="text-slate-600">Reading: 📖 <strong>{selectedStudent.learningLevel?.reading || 'Beginner'}</strong></span>
                        <span class="text-amber-600">{levelProgressMap.reading[selectedStudent.learningLevel?.reading || 'Beginner']}%</span>
                      </div>
                      <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${levelProgressMap.reading[selectedStudent.learningLevel?.reading || 'Beginner']}%` }}
                          class="h-full bg-amber-500 rounded-full"
                        ></div>
                      </div>
                    </div>

                    {/* Math Level bar */}
                    <div class="space-y-1">
                      <div class="flex justify-between text-xs font-semibold">
                        <span class="text-slate-600">Math: 🧮 <strong>{selectedStudent.learningLevel?.math || 'Beginner'}</strong></span>
                        <span class="text-teal-600">{levelProgressMap.math[selectedStudent.learningLevel?.math || 'Beginner']}%</span>
                      </div>
                      <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${levelProgressMap.math[selectedStudent.learningLevel?.math || 'Beginner']}%` }}
                          class="h-full bg-teal-500 rounded-full"
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Start Check-in Action */}
                  <div class="border-t border-slate-100 pt-4 space-y-3">
                    <div>
                      <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Select Check-in Subject</label>
                      <div class="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setCheckinSubject('reading')}
                          class={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition ${
                            checkinSubject === 'reading'
                              ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          📖 Reading Check
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckinSubject('math')}
                          class={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition ${
                            checkinSubject === 'math'
                              ? 'bg-teal-50/50 border-teal-500 text-teal-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          🧮 Math Check
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleStartCheckin}
                      class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg text-sm shadow transition"
                    >
                      🚀 Start Weekly Quiz / क्विज़ शुरू करें
                    </button>
                  </div>
                </div>
              ) : (
                /* Interactive Quiz Flow */
                <div class="space-y-4">
                  {/* Quiz Steps (Questions 1, 2, 3) */}
                  {quizStep >= 1 && quizStep <= 3 && (
                    <div class="space-y-5 py-2">
                      <div class="flex justify-between items-center text-xs font-semibold text-slate-400">
                        <span>Subject: {checkinSubject === 'reading' ? '📖 Reading' : '🧮 Math'} ({currentLevel})</span>
                        <span>Question {quizStep} of 3</span>
                      </div>

                      <div class="bg-amber-50/40 border border-amber-200/50 p-5 rounded-xl text-center shadow-sm space-y-4">
                        <p class="text-xs text-slate-500 font-medium">Show the screen to your child and ask:</p>
                        <p class="text-2xl font-extrabold text-slate-800 tracking-wide select-none">
                          {questions[quizStep - 1]?.text}
                        </p>
                      </div>

                      <div class="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleAnswer(false)}
                          class="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-3 rounded-xl transition text-sm"
                        >
                          ❌ Incorrect / नहीं पढ़ पाया
                        </button>
                        <button
                          onClick={() => handleAnswer(true)}
                          class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold py-3 rounded-xl transition text-sm"
                        >
                          ✅ Correct / सही पढ़ा
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback Form (Step 4) */}
                  {quizStep === 4 && (
                    <div class="space-y-4">
                      <div class="text-center py-2">
                        <span class="text-3xl">🎉</span>
                        <h4 class="font-extrabold text-slate-800 mt-1">Quiz Completed!</h4>
                        <p class="text-xs text-slate-500">Score: <strong class="text-amber-500 text-sm">{quizScore} / 3</strong></p>
                      </div>

                      <div class="space-y-3 pt-2 border-t border-slate-100">
                        <div>
                          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Your Confidence Rating / आपका विश्वास
                          </label>
                          <div class="flex space-x-2 justify-center py-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackConfidence(star)}
                                class="text-2xl transition duration-100 hover:scale-110"
                              >
                                {star <= feedbackConfidence ? '★' : '☆'}
                              </button>
                            ))}
                          </div>
                          <p class="text-center text-[10px] text-slate-400 capitalize">
                            {feedbackConfidence === 5 && 'Excellent progress / बहुत बढ़िया'}
                            {feedbackConfidence === 4 && 'Good progress / अच्छा है'}
                            {feedbackConfidence === 3 && 'Average progress / सामान्य'}
                            {feedbackConfidence === 2 && 'Needs more work / सुधार की जरूरत'}
                            {feedbackConfidence === 1 && 'Struggling / कठिनाई हो रही है'}
                          </p>
                        </div>

                        <div>
                          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Weekly Remarks / कोई सुझाव या टिप्पणी
                          </label>
                          <textarea
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            placeholder="How did they do? Any details to share with the coordinator?..."
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 h-20"
                          ></textarea>
                        </div>
                      </div>

                      <div class="flex space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setQuizStep(0)}
                          class="w-1/3 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                        >
                          Restart
                        </button>
                        <button
                          onClick={submitCheckIn}
                          disabled={submitting}
                          class="w-2/3 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg text-sm shadow transition disabled:opacity-50"
                        >
                          {submitting ? 'Submitting...' : 'Submit / दर्ज करें'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Past Check-ins History */}
          <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Past Weekend Check-ins</h3>
            {pastCheckIns.length === 0 ? (
              <p class="text-xs text-slate-400 italic">No check-ins completed yet.</p>
            ) : (
              <div class="space-y-2">
                {pastCheckIns.map(c => (
                  <div key={c._id} class="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-100 text-xs">
                    <div>
                      <p class="font-semibold text-slate-800 capitalize">
                        {c.quizResults?.subject} Check
                      </p>
                      <p class="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-amber-600">Score: {c.quizResults?.score}/3</p>
                      <span class="text-amber-500 text-[10px]">
                        {'★'.repeat(c.parentFeedback?.confidence)}
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
