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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Session Logger Form */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Weekly Session Log</h2>
            <p className="text-xs text-slate-400 mt-1">Log weekly studies with your junior student</p>
          </div>

          <div className="p-6">
            {students.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded border border-slate-200">
                <h3 className="font-semibold text-slate-800 text-sm">No Students Assigned</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed">
                  You are not assigned to tutor any junior student. Please contact coordinator <strong>Amit Patel</strong> to link a student to your account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {message && (
                  <div className={`p-4 rounded text-xs border ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {message}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Select Student */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Junior Student</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-3 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                    >
                      {students.map(s => (
                        <option key={s._id} value={s._id}>{s.name} (Grade {s.grade})</option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-3 text-slate-850 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setSubject('reading')}
                        className={`flex-1 py-2.5 px-4 rounded text-xs uppercase tracking-wider font-semibold border transition ${
                          subject === 'reading'
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        Reading
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubject('math')}
                        className={`flex-1 py-2.5 px-4 rounded text-xs uppercase tracking-wider font-semibold border transition ${
                          subject === 'math'
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        Math
                      </button>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Session Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-3 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Topics Covered / क्या पढ़ाया?</label>
                  <textarea
                    value={topicsCovered}
                    onChange={(e) => setTopicsCovered(e.target.value)}
                    required
                    placeholder="Describe specific letters read, equations solved, etc..."
                    className="w-full px-4 py-3 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950 h-24"
                  ></textarea>
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Observations / क्या सुधार दिखा?</label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Is the student improving? What did they struggle with?..."
                    className="w-full px-4 py-3 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950 h-24"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded text-xs uppercase tracking-wider transition disabled:opacity-50"
                >
                  {submitting ? 'Logging...' : 'Submit Session Log / लॉग जमा करें'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Tutor Assignment Details & History */}
      <div className="space-y-6">
        {/* Assigned Students Info */}
        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Junior Students</h3>
          {students.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No students linked to your account.</p>
          ) : (
            <div className="space-y-3">
              {students.map(s => (
                <div key={s._id} className="p-4 bg-slate-50 rounded border border-slate-200">
                  <p className="font-semibold text-slate-850 text-sm">{s.name}</p>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>Grade {s.grade}</span>
                    <span>Level: <strong className="text-slate-700 font-medium">{s.learningLevel?.reading || 'Beginner'}</strong> (Read)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History of logs */}
        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Past Session Logs</h3>
          {sessionLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No logs submitted yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {sessionLogs.map(l => (
                <div key={l._id} className="p-4 bg-slate-50 rounded border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-850 text-sm">{l.studentId?.name || 'Student'}</span>
                    <span className="border border-slate-200 text-slate-550 px-2 py-0.5 rounded text-[9px] uppercase font-semibold bg-white">
                      {l.subject}
                    </span>
                  </div>
                  <p className="text-slate-500 leading-relaxed font-medium">{l.topicsCovered}</p>
                  <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 mt-1">
                    <span>Duration: {l.duration} mins</span>
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
