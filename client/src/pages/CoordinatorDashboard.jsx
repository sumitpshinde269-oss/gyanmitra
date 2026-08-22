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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes, staffRes, logsRes, checkinsRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/students'),
        axios.get('/api/users/staff-parents'),
        axios.get('/api/session-logs'),
        axios.get('/api/weekend-checkins')
      ]);

      setStats(statsRes.data);
      setStudents(studentsRes.data);
      setTutors(staffRes.data.tutors);
      setParents(staffRes.data.parents);
      setLogs(logsRes.data);
      setCheckins(checkinsRes.data);
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

  if (loading) {
    return (
      <div class="flex items-center justify-center min-h-[50vh]">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
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
    <div class="space-y-6">
      {/* Page Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-amber-100 gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-800">🏫 Coordinator Dashboard</h1>
          <p class="text-xs text-slate-500">Monitor village student tutoring, levels and weekend check-ins</p>
        </div>
        <button
          onClick={() => setShowAddStudent(true)}
          class="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow transition"
        >
          ➕ Register New Student
        </button>
      </div>

      {/* Tabs */}
      <div class="flex border-b border-slate-200 overflow-x-auto gap-2">
        {['overview', 'students', 'tutorLogs', 'checkins'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            class={`px-4 py-2.5 font-semibold text-sm border-b-2 whitespace-nowrap transition ${
              activeTab === tab
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'overview' && '📊 Stats & Progress'}
            {tab === 'students' && '🎓 Students Roster'}
            {tab === 'tutorLogs' && '✍️ Tutor Feedbacks'}
            {tab === 'checkins' && '👨‍👩‍👦 Weekend Check-ins'}
          </button>
        ))}
      </div>

      {/* Tab Panels */}

      {/* Tab: OVERVIEW */}
      {activeTab === 'overview' && (
        <div class="space-y-6">
          {/* Key Stat Cards */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
              <p class="text-slate-400 text-xs font-semibold uppercase">Students Registered</p>
              <p class="text-3xl font-extrabold text-amber-500 mt-1">{stats?.counts?.students || 0}</p>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
              <p class="text-slate-400 text-xs font-semibold uppercase">Active Tutors</p>
              <p class="text-3xl font-extrabold text-teal-500 mt-1">{stats?.counts?.tutors || 0}</p>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
              <p class="text-slate-400 text-xs font-semibold uppercase">Weekly Logs Submitted</p>
              <p class="text-3xl font-extrabold text-emerald-500 mt-1">{stats?.counts?.sessions || 0}</p>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
              <p class="text-slate-400 text-xs font-semibold uppercase">Check-ins Completed</p>
              <p class="text-3xl font-extrabold text-sky-500 mt-1">{stats?.counts?.checkins || 0}</p>
            </div>
          </div>

          {/* Recharts Graphical Analysis */}
          <div class="bg-white p-4 sm:p-6 rounded-2xl border border-amber-100 shadow-sm">
            <h3 class="text-base font-bold text-slate-800 mb-4">📈 Learning Level Distribution</h3>
            <div class="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Reading" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Math" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p class="text-[10px] text-slate-400 text-center mt-2">
              Note: ASER Level equivalents range from Beginner up to Story (Reading) and Division (Math).
            </p>
          </div>
        </div>
      )}

      {/* Tab: STUDENTS */}
      {activeTab === 'students' && (
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase">
                  <th class="p-3">Student Name</th>
                  <th class="p-3">Grade</th>
                  <th class="p-3">Assigned Tutor</th>
                  <th class="p-3">Assigned Parent</th>
                  <th class="p-3 text-center">Reading Level</th>
                  <th class="p-3 text-center">Math Level</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student._id} class="hover:bg-slate-50/50">
                    <td class="p-3 font-semibold text-slate-800">{student.name}</td>
                    <td class="p-3 text-slate-500 text-xs font-medium">Grade {student.grade}</td>
                    <td class="p-3">
                      {student.tutorId ? (
                        <span class="text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-xs font-semibold">
                          👤 {student.tutorId.name || student.tutorId}
                        </span>
                      ) : (
                        <span class="text-slate-400 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td class="p-3">
                      {student.parentId ? (
                        <span class="text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-xs font-semibold">
                          🏡 {student.parentId.name || student.parentId}
                        </span>
                      ) : (
                        <span class="text-slate-400 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td class="p-3 text-center">
                      <span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">
                        {student.learningLevel?.reading || 'Beginner'}
                      </span>
                    </td>
                    <td class="p-3 text-center">
                      <span class="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-xs font-bold">
                        {student.learningLevel?.math || 'Beginner'}
                      </span>
                    </td>
                    <td class="p-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenAssign(student)}
                        class="text-xs bg-slate-100 hover:bg-amber-100 hover:text-amber-800 border border-slate-200 text-slate-600 px-2 py-1 rounded transition"
                      >
                        🔗 Assign
                      </button>
                      <button
                        onClick={() => handleOpenEditLevels(student)}
                        class="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded transition shadow-sm font-medium"
                      >
                        📶 Levels
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: TUTOR LOGS */}
      {activeTab === 'tutorLogs' && (
        <div class="space-y-4">
          {logs.length === 0 ? (
            <div class="bg-white p-8 text-center text-slate-500 rounded-xl border border-slate-100 shadow-sm">
              No session logs submitted yet.
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.map((log) => (
                <div key={log._id} class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="font-bold text-slate-800">{log.studentId?.name || 'Unknown Student'}</h4>
                      <p class="text-xs text-slate-500">
                        Tutored by: <strong class="text-teal-600">{log.tutorId?.name || 'Unknown Tutor'}</strong>
                      </p>
                    </div>
                    <span class={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      log.subject === 'reading' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {log.subject}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 text-xs text-slate-500 bg-slate-50 p-2 rounded gap-1">
                    <p>📅 Date: {new Date(log.date).toLocaleDateString()}</p>
                    <p>⏱️ Duration: {log.duration} mins</p>
                  </div>
                  <div class="text-xs space-y-1">
                    <p class="font-semibold text-slate-700">Topics Covered:</p>
                    <p class="text-slate-600 bg-amber-50/20 p-2 rounded border border-amber-100/30">{log.topicsCovered || 'N/A'}</p>
                  </div>
                  <div class="text-xs space-y-1">
                    <p class="font-semibold text-slate-700">Tutor Observations:</p>
                    <p class="text-slate-600 italic bg-amber-50/20 p-2 rounded border border-amber-100/30">"{log.observations || 'None'}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: PARENT CHECK-INS */}
      {activeTab === 'checkins' && (
        <div class="space-y-4">
          {checkins.length === 0 ? (
            <div class="bg-white p-8 text-center text-slate-500 rounded-xl border border-slate-100 shadow-sm">
              No weekend check-ins completed yet.
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checkins.map((checkin) => (
                <div key={checkin._id} class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="font-bold text-slate-800">{checkin.studentId?.name || 'Unknown Student'}</h4>
                      <p class="text-xs text-slate-500">
                        Parent: <strong class="text-sky-600">{checkin.parentId?.name || 'Unknown Parent'}</strong>
                      </p>
                    </div>
                    <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      ✓ Completed
                    </span>
                  </div>
                  <div class="flex justify-between bg-slate-50 p-2 rounded text-xs">
                    <span class="capitalize">📚 Subject Quiz: <strong>{checkin.quizResults?.subject}</strong></span>
                    <span>🎯 Score: <strong class="text-amber-600">{checkin.quizResults?.score}/{checkin.quizResults?.total}</strong></span>
                  </div>
                  <div class="text-xs space-y-1">
                    <div class="flex items-center space-x-1">
                      <span class="font-semibold text-slate-700">Parent Confidence:</span>
                      <span class="text-amber-500">
                        {'★'.repeat(checkin.parentFeedback?.confidence || 0)}
                        {'☆'.repeat(5 - (checkin.parentFeedback?.confidence || 0))}
                      </span>
                    </div>
                    <p class="text-slate-600 bg-amber-50/20 p-2 rounded border border-amber-100/30">
                      "{checkin.parentFeedback?.comments || 'No comment written'}"
                    </p>
                  </div>
                  <p class="text-[10px] text-slate-400 text-right">
                    Submitted: {new Date(checkin.createdAt).toLocaleString()}
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
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div class="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden border border-amber-100">
            <div class="bg-amber-500 p-4 text-white font-bold flex justify-between items-center">
              <span>Register Student</span>
              <button onClick={() => setShowAddStudent(false)} class="hover:text-amber-100 text-lg">×</button>
            </div>
            <form onSubmit={handleAddStudent} class="p-5 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Grade (3rd to 8th)</label>
                <select
                  value={newStudentGrade}
                  onChange={(e) => setNewStudentGrade(e.target.value)}
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {[3, 4, 5, 6, 7, 8].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
              <div class="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  class="w-1/2 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="w-1/2 bg-amber-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 shadow transition"
                >
                  Create Student
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
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden border border-amber-100">
            <div class="bg-amber-500 p-4 text-white font-bold flex justify-between items-center">
              <span>Assign Tutor & Parent</span>
              <button onClick={() => setAssignStudentId(null)} class="hover:text-amber-100 text-lg">×</button>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Senior Tutor</label>
                <select
                  value={assignTutorId}
                  onChange={(e) => setAssignTutorId(e.target.value)}
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- No Tutor --</option>
                  {tutors.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Parent</label>
                <select
                  value={assignParentId}
                  onChange={(e) => setAssignParentId(e.target.value)}
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- No Parent --</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div class="flex space-x-2 pt-2">
                <button
                  onClick={() => setAssignStudentId(null)}
                  class="w-1/2 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  class="w-1/2 bg-amber-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 shadow transition"
                >
                  Save Assignment
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
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden border border-amber-100">
            <div class="bg-amber-500 p-4 text-white font-bold flex justify-between items-center">
              <span>Set Learning Levels</span>
              <button onClick={() => setEditLevelStudentId(null)} class="hover:text-amber-100 text-lg">×</button>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Reading ASER Level</label>
                <select
                  value={editReadingLevel}
                  onChange={(e) => setEditReadingLevel(e.target.value)}
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {['Beginner', 'Letter', 'Word', 'Paragraph', 'Story'].map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Math ASER Level</label>
                <select
                  value={editMathLevel}
                  onChange={(e) => setEditMathLevel(e.target.value)}
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {['Beginner', 'Number', 'Addition', 'Subtraction', 'Division'].map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
              <div class="flex space-x-2 pt-2">
                <button
                  onClick={() => setEditLevelStudentId(null)}
                  class="w-1/2 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLevels}
                  class="w-1/2 bg-amber-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 shadow transition"
                >
                  Update Levels
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
