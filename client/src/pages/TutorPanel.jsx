import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TutorPanel() {
  const [students, setStudents] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [subject, setSubject] = useState('reading');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('30');
  const [topicsCovered, setTopicsCovered] = useState('');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTutorData();
  }, []);

  const fetchTutorData = async () => {
    try {
      setLoading(true);
      const [studentsRes, logsRes] = await Promise.all([
        axios.get('/api/students'),
        axios.get('/api/session-logs')
      ]);

      setStudents(studentsRes.data);
      setSessionLogs(logsRes.data);
      if (studentsRes.data.length > 0) {
        setSelectedStudentId(studentsRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !topicsCovered.trim()) {
      setMessage('Please select a student and describe topics covered.');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      
      await axios.post('/api/session-logs', {
        studentId: selectedStudentId,
        date,
        subject,
        duration: Number(duration),
        topicsCovered,
        observations
      });

      // Clear fields
      setTopicsCovered('');
      setObservations('');
      setMessage('Session logged successfully!');
      
      // Reload history
      const logsRes = await axios.get('/api/session-logs');
      setSessionLogs(logsRes.data);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save tutoring log.');
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

  return (
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Session Logger Form */}
      <div class="md:col-span-2 space-y-4">
        <div class="bg-white rounded-2xl shadow-md border border-amber-100 overflow-hidden">
          {/* Header */}
          <div class="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white">
            <h2 class="text-lg font-bold">✍️ Weekly Tutoring Session Log</h2>
            <p class="text-xs text-amber-100">Log weekly studies with your junior student</p>
          </div>

          <div class="p-5 sm:p-6">
            {students.length === 0 ? (
              <div class="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <span class="text-4xl">📭</span>
                <h3 class="font-bold text-slate-700 mt-2">No Students Assigned</h3>
                <p class="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  You are not assigned to tutor any junior student. Please contact coordinator <strong>Amit Patel</strong> to link a student to your account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} class="space-y-4">
                {message && (
                  <div class={`p-3 rounded-lg text-sm border ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {message}
                  </div>
                )}

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Student */}
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Select Junior Student</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {students.map(s => (
                        <option key={s._id} value={s._id}>{s.name} (Grade {s.grade})</option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Subject */}
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                    <div class="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setSubject('reading')}
                        class={`flex-1 py-1.5 px-3 rounded-lg text-sm font-semibold border transition ${
                          subject === 'reading'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        📖 Reading
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubject('math')}
                        class={`flex-1 py-1.5 px-3 rounded-lg text-sm font-semibold border transition ${
                          subject === 'math'
                            ? 'bg-teal-50/50 border-teal-500 text-teal-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        🧮 Math
                      </button>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Session Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes (1 Hour)</option>
                    </select>
                  </div>
                </div>

                {/* Topics Covered */}
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Topics Covered / क्या पढ़ाया?</label>
                  <textarea
                    value={topicsCovered}
                    onChange={(e) => setTopicsCovered(e.target.value)}
                    required
                    placeholder="Describe specific letters read, equations solved, or books opened..."
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 h-20"
                  ></textarea>
                </div>

                {/* Observations */}
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Observations / क्या सुधार दिखा?</label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Is the student improving? What did they struggle with?..."
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 h-20"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg text-sm shadow transition disabled:opacity-50"
                >
                  {submitting ? 'Logging...' : 'Submit Session Log / लॉग जमा करें'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Tutor Assignment Details & History */}
      <div class="space-y-4">
        {/* Assigned Students Info */}
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Junior Students</h3>
          {students.length === 0 ? (
            <p class="text-xs text-slate-400 italic">No students linked to your account.</p>
          ) : (
            <div class="space-y-2">
              {students.map(s => (
                <div key={s._id} class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p class="font-bold text-slate-800 text-sm">{s.name}</p>
                  <div class="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Grade {s.grade}</span>
                    <span>Level: <strong class="text-amber-600">{s.learningLevel?.reading || 'Beginner'}</strong> (Read)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History of logs */}
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Past Session Logs</h3>
          {sessionLogs.length === 0 ? (
            <p class="text-xs text-slate-400 italic">No logs submitted yet.</p>
          ) : (
            <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
              {sessionLogs.map(l => (
                <div key={l._id} class="p-2.5 bg-slate-50 rounded border border-slate-100 text-xs space-y-1">
                  <div class="flex justify-between font-semibold">
                    <span class="text-slate-800">{l.studentId?.name || 'Student'}</span>
                    <span class={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                      l.subject === 'reading' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {l.subject}
                    </span>
                  </div>
                  <p class="text-slate-600 font-medium">✏️ {l.topicsCovered}</p>
                  <div class="flex justify-between text-[10px] text-slate-400">
                    <span>⏱️ {l.duration} mins</span>
                    <span>{new Date(l.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TutorPanel;
