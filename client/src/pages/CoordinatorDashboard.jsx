import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

function CoordinatorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [parents, setParents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals / Form states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('3');
  const [assignStudentId, setAssignStudentId] = useState(null);
  const [assignTutorId, setAssignTutorId] = useState('');
  const [assignParentId, setAssignParentId] = useState('');

  // Level selector state
  const [editLevelStudentId, setEditLevelStudentId] = useState(null);
  const [editReadingLevel, setEditReadingLevel] = useState('');
  const [editMathLevel, setEditMathLevel] = useState('');

  // Session Guide editor state
  const [sessionGuides, setSessionGuides] = useState([]);
  const [guideSubject, setGuideSubject] = useState('reading');
  const [guideLevel, setGuideLevel] = useState('Beginner');
  const [guideActivities, setGuideActivities] = useState([
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' }
  ]);
  const [guideSaving, setGuideSaving] = useState(false);
  const [guideMessage, setGuideMessage] = useState('');

  const READING_LEVELS = ['Beginner', 'Letter', 'Word', 'Paragraph', 'Story'];
  const MATH_LEVELS = ['Beginner', 'Number', 'Addition', 'Subtraction', 'Division'];
  const levelsForSubject = guideSubject === 'reading' ? READING_LEVELS : MATH_LEVELS;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes, staffRes, logsRes, checkinsRes, guidesRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/students'),
        axios.get('/api/users/staff-parents'),
        axios.get('/api/session-logs'),
        axios.get('/api/weekend-checkins'),
        axios.get('/api/session-guides')
      ]);

      setStats(statsRes.data);
      setStudents(studentsRes.data);
      setTutors(staffRes.data.tutors);
      setParents(staffRes.data.parents);
      setLogs(logsRes.data);
      setCheckins(checkinsRes.data);
      setSessionGuides(guidesRes.data);
    } catch (err) {
      console.error('Error fetching coordinator dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    try {
      await axios.post('/api/students', {
        name: newStudentName,
        grade: Number(newStudentGrade)
      });
      setNewStudentName('');
      setShowAddStudent(false);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssign = (student) => {
    setAssignStudentId(student._id);
    setAssignTutorId(student.tutorId?._id || student.tutorId || '');
    setAssignParentId(student.parentId?._id || student.parentId || '');
  };

  const handleAssign = async () => {
    try {
      await axios.patch(`/api/students/${assignStudentId}/assign`, {
        tutorId: assignTutorId || null,
        parentId: assignParentId || null
      });
      setAssignStudentId(null);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditLevels = (student) => {
    setEditLevelStudentId(student._id);
    setEditReadingLevel(student.learningLevel?.reading || 'Beginner');
    setEditMathLevel(student.learningLevel?.math || 'Beginner');
  };

  const handleUpdateLevels = async () => {
    try {
      await axios.patch(`/api/students/${editLevelStudentId}/level`, {
        reading: editReadingLevel,
        math: editMathLevel
      });
      setEditLevelStudentId(null);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Load activities into editor when subject/level or guides change
  useEffect(() => {
    const guide = sessionGuides.find((g) => g.subject === guideSubject && g.level === guideLevel);
    const acts = guide?.activities || [];
    setGuideActivities([
      { title: acts[0]?.title || '', description: acts[0]?.description || '' },
      { title: acts[1]?.title || '', description: acts[1]?.description || '' },
      { title: acts[2]?.title || '', description: acts[2]?.description || '' }
    ]);
    setGuideMessage('');
  }, [guideSubject, guideLevel, sessionGuides]);

  const handleGuideSubjectChange = (nextSubject) => {
    setGuideSubject(nextSubject);
    setGuideLevel(nextSubject === 'reading' ? 'Beginner' : 'Beginner');
  };

  const updateGuideActivity = (index, field, value) => {
    setGuideActivities((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const handleSaveGuide = async () => {
    const filled = guideActivities.filter((a) => a.title.trim() && a.description.trim());
    if (filled.length < 2 || filled.length > 3) {
      setGuideMessage('Enter 2 or 3 complete activities (title + description).');
      return;
    }

    try {
      setGuideSaving(true);
      setGuideMessage('');
      await axios.put(`/api/session-guides/${guideSubject}/${guideLevel}`, {
        activities: filled
      });
      setGuideMessage('Session guide saved.');
      const guidesRes = await axios.get('/api/session-guides');
      setSessionGuides(guidesRes.data);
    } catch (err) {
      setGuideMessage(err.response?.data?.error || 'Failed to save session guide.');
    } finally {
      setGuideSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  // Prep Recharts data
  const chartData = [
    { name: 'Beginner', Reading: stats?.levels?.reading?.Beginner || 0, Math: stats?.levels?.math?.Beginner || 0 },
    { name: 'Letter/Num', Reading: stats?.levels?.reading?.Letter || 0, Math: stats?.levels?.math?.Number || 0 },
    { name: 'Word/Add', Reading: stats?.levels?.reading?.Word || 0, Math: stats?.levels?.math?.Addition || 0 },
    { name: 'Para/Sub', Reading: stats?.levels?.reading?.Paragraph || 0, Math: stats?.levels?.math?.Subtraction || 0 },
    { name: 'Story/Div', Reading: stats?.levels?.reading?.Story || 0, Math: stats?.levels?.math?.Division || 0 }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded border border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Coordinator Dashboard</h1>
          <p className="text-xs text-slate-405 mt-1">Monitor student tutoring progress, levels, and parent check-ins</p>
        </div>
        <button
          onClick={() => setShowAddStudent(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider px-5 py-3 rounded transition shadow-sm"
        >
          Register New Student
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-4">
        {[
          { id: 'overview', label: 'Stats & Progress' },
          { id: 'students', label: 'Students Roster' },
          { id: 'sessionGuides', label: 'Session Guides' },
          { id: 'tutorLogs', label: 'Tutor Feedbacks' },
          { id: 'checkins', label: 'Weekend Check-ins' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition ${
              activeTab === t.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}

      {/* Tab: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded border border-slate-200 text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Students Registered</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.counts?.students || 0}</p>
            </div>
            <div className="bg-white p-6 rounded border border-slate-200 text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Active Tutors</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.counts?.tutors || 0}</p>
            </div>
            <div className="bg-white p-6 rounded border border-slate-200 text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Weekly Logs</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.counts?.sessions || 0}</p>
            </div>
            <div className="bg-white p-6 rounded border border-slate-200 text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Check-ins Completed</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.counts?.checkins || 0}</p>
            </div>
          </div>

          {/* Recharts Graphical Analysis */}
          <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">Learning Level Distribution</h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Legend wrapperStyle={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  <Bar dataKey="Reading" fill="#1e293b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Math" fill="#64748b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-4">
              Note: ASER Level equivalents range from Beginner up to Story (Reading) and Division (Math).
            </p>
          </div>
        </div>
      )}

      {/* Tab: STUDENTS */}
      {activeTab === 'students' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Grade</th>
                  <th className="p-4">Assigned Tutor</th>
                  <th className="p-4">Assigned Parent</th>
                  <th className="p-4 text-center">Reading Level</th>
                  <th className="p-4 text-center">Math Level</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-semibold text-slate-900 text-sm">{student.name}</td>
                    <td className="p-4 text-slate-400 font-medium">Grade {student.grade}</td>
                    <td className="p-4">
                      {student.tutorId ? (
                        <span className="border border-slate-200 text-slate-700 px-2.5 py-1 rounded text-[10px] font-semibold bg-slate-50 uppercase tracking-wider">
                          {student.tutorId.name || student.tutorId}
                        </span>
                      ) : (
                        <span className="text-slate-350 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      {student.parentId ? (
                        <span className="border border-slate-200 text-slate-700 px-2.5 py-1 rounded text-[10px] font-semibold bg-slate-50 uppercase tracking-wider">
                          {student.parentId.name || student.parentId}
                        </span>
                      ) : (
                        <span className="text-slate-350 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="border border-slate-200 bg-white text-slate-800 px-2.5 py-1 rounded text-[10px] font-bold uppercase">
                        {student.learningLevel?.reading || 'Beginner'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="border border-slate-200 bg-white text-slate-800 px-2.5 py-1 rounded text-[10px] font-bold uppercase">
                        {student.learningLevel?.math || 'Beginner'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenAssign(student)}
                        className="text-[10px] uppercase font-bold tracking-wider bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded transition"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => handleOpenEditLevels(student)}
                        className="text-[10px] uppercase font-bold tracking-wider bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded transition shadow-sm"
                      >
                        Levels
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: SESSION GUIDES */}
      {activeTab === 'sessionGuides' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Edit Session Guides</h2>
            <p className="text-xs text-slate-400 mt-1">Set 2–3 teaching activities tutors see for each learning level</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => handleGuideSubjectChange('reading')}
                    className={`flex-1 py-2.5 px-4 rounded text-xs uppercase tracking-wider font-semibold border transition ${
                      guideSubject === 'reading'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Reading
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGuideSubjectChange('math')}
                    className={`flex-1 py-2.5 px-4 rounded text-xs uppercase tracking-wider font-semibold border transition ${
                      guideSubject === 'math'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Math
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Level</label>
                <select
                  value={guideLevel}
                  onChange={(e) => setGuideLevel(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded p-3 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                >
                  {levelsForSubject.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            </div>

            {guideMessage && (
              <div className={`p-4 rounded text-xs border ${
                guideMessage.includes('saved')
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {guideMessage}
              </div>
            )}

            <div className="space-y-5">
              {guideActivities.map((activity, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Activity {idx + 1}{idx === 2 ? ' (optional)' : ''}
                  </p>
                  <input
                    type="text"
                    value={activity.title}
                    onChange={(e) => updateGuideActivity(idx, 'title', e.target.value)}
                    placeholder="Activity title"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950 bg-white"
                  />
                  <textarea
                    value={activity.description}
                    onChange={(e) => updateGuideActivity(idx, 'description', e.target.value)}
                    placeholder="Simple steps the tutor can follow..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950 h-20 bg-white"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveGuide}
              disabled={guideSaving}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded text-xs uppercase tracking-wider transition disabled:opacity-50"
            >
              {guideSaving ? 'Saving...' : 'Save Session Guide'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: TUTOR LOGS */}
      {activeTab === 'tutorLogs' && (
        <div className="space-y-6">
          {logs.length === 0 ? (
            <div className="bg-white p-8 text-center text-slate-500 rounded border border-slate-200">
              No session logs submitted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {logs.map((log) => (
                <div key={log._id} className="bg-white p-5 rounded border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{log.studentId?.name || 'Unknown Student'}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Tutored by: <strong className="text-slate-700 font-medium">{log.tutorId?.name || 'Unknown Tutor'}</strong>
                      </p>
                    </div>
                    <span className="border border-slate-200 bg-white text-slate-700 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
                      {log.subject}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-100 gap-2">
                    <p>Date: {new Date(log.date).toLocaleDateString()}</p>
                    <p>Duration: {log.duration} mins</p>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Topics Covered:</p>
                    <p className="text-slate-650 bg-slate-50/50 p-3 rounded border border-slate-200/50 leading-relaxed">{log.topicsCovered || 'N/A'}</p>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Tutor Observations:</p>
                    <p className="text-slate-650 italic bg-slate-50/50 p-3 rounded border border-slate-200/50 leading-relaxed">"{log.observations || 'None'}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: PARENT CHECK-INS */}
      {activeTab === 'checkins' && (
        <div className="space-y-6">
          {checkins.length === 0 ? (
            <div className="bg-white p-8 text-center text-slate-500 rounded border border-slate-200">
              No weekend check-ins completed yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {checkins.map((checkin) => (
                <div key={checkin._id} className="bg-white p-5 rounded border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{checkin.studentId?.name || 'Unknown Student'}</h4>
                      <p className="text-xs text-slate-405 mt-1">
                        Parent: <strong className="text-slate-700 font-medium">{checkin.parentId?.name || 'Unknown Parent'}</strong>
                      </p>
                    </div>
                    <span className="border border-slate-200 bg-white text-slate-500 px-2 py-0.5 rounded text-[9px] uppercase font-semibold">
                      Completed
                    </span>
                  </div>
                  <div className="flex justify-between bg-slate-50 p-3 rounded border border-slate-100 text-xs">
                    <span className="capitalize font-medium text-slate-600">Subject Quiz: {checkin.quizResults?.subject}</span>
                    <span className="font-semibold text-slate-900">Score: {checkin.quizResults?.score}/{checkin.quizResults?.total}</span>
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      Parent Confidence: {checkin.parentFeedback?.confidence}/5
                    </div>
                    <p className="text-slate-600 bg-slate-50/50 p-3 rounded border border-slate-200/50 leading-relaxed">
                      "{checkin.parentFeedback?.comments || 'No comments'}"
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 text-right uppercase tracking-wider font-semibold">
                    Submitted: {new Date(checkin.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: Add Student
         ======================================================== */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded border border-slate-200 w-full max-w-sm shadow-xl overflow-hidden">
            <div className="border-b border-slate-200 p-5 font-bold text-slate-900 uppercase tracking-wider text-xs flex justify-between items-center">
              <span>Register Student</span>
              <button onClick={() => setShowAddStudent(false)} className="hover:text-slate-500 text-base font-semibold">Cancel</button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Student Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded text-slate-805 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Grade (3rd to 8th)</label>
                <select
                  value={newStudentGrade}
                  onChange={(e) => setNewStudentGrade(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded text-slate-805 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                >
                  {[3, 4, 5, 6, 7, 8].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="w-1/2 border border-slate-200 text-slate-600 py-3 rounded text-xs uppercase tracking-wider font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-slate-900 text-white py-3 rounded text-xs uppercase tracking-wider font-semibold hover:bg-slate-800 shadow transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Assign Tutor and Parent
         ======================================================== */}
      {assignStudentId && (
        <div className="fixed inset-0 bg-slate-955/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border border-slate-200 w-full max-w-sm shadow-xl overflow-hidden">
            <div className="border-b border-slate-200 p-5 font-bold text-slate-900 uppercase tracking-wider text-xs flex justify-between items-center">
              <span>Assign Tutor & Parent</span>
              <button onClick={() => setAssignStudentId(null)} className="hover:text-slate-500 text-base font-semibold">Cancel</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Senior Tutor</label>
                <select
                  value={assignTutorId}
                  onChange={(e) => setAssignTutorId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded text-slate-805 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                >
                  <option value="">-- No Tutor --</option>
                  {tutors.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Parent</label>
                <select
                  value={assignParentId}
                  onChange={(e) => setAssignParentId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded text-slate-805 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                >
                  <option value="">-- No Parent --</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setAssignStudentId(null)}
                  className="w-1/2 border border-slate-200 text-slate-600 py-3 rounded text-xs uppercase tracking-wider font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  className="w-1/2 bg-slate-900 text-white py-3 rounded text-xs uppercase tracking-wider font-semibold hover:bg-slate-800 shadow transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Update Learning Levels
         ======================================================== */}
      {editLevelStudentId && (
        <div className="fixed inset-0 bg-slate-955/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border border-slate-200 w-full max-w-sm shadow-xl overflow-hidden">
            <div className="border-b border-slate-200 p-5 font-bold text-slate-900 uppercase tracking-wider text-xs flex justify-between items-center">
              <span>Set Learning Levels</span>
              <button onClick={() => setEditLevelStudentId(null)} className="hover:text-slate-500 text-base font-semibold">Cancel</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Reading ASER Level</label>
                <select
                  value={editReadingLevel}
                  onChange={(e) => setEditReadingLevel(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded text-slate-805 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                >
                  {['Beginner', 'Letter', 'Word', 'Paragraph', 'Story'].map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Math ASER Level</label>
                <select
                  value={editMathLevel}
                  onChange={(e) => setEditMathLevel(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded text-slate-805 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                >
                  {['Beginner', 'Number', 'Addition', 'Subtraction', 'Division'].map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setEditLevelStudentId(null)}
                  className="w-1/2 border border-slate-200 text-slate-650 py-3 rounded text-xs uppercase tracking-wider font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLevels}
                  className="w-1/2 bg-slate-900 text-white py-3 rounded text-xs uppercase tracking-wider font-semibold hover:bg-slate-800 shadow transition"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoordinatorDashboard;
