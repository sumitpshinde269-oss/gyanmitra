import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function ConsentForm() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [signed, setSigned] = useState(false);
  const [signature, setSignature] = useState('');
  const [terms, setTerms] = useState({
    acceptTutoring: false,
    weeklyCheckin: false,
    shareData: false
  });
  const [consentStatus, setConsentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract studentId from route state if redirected from Check-in
  const redirectStudentId = location.state?.studentId;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/students');
      setStudents(res.data);
      if (res.data.length > 0) {
        // Prefer the redirect student, otherwise select the first child
        const defaultStudent = res.data.find(s => s._id === redirectStudentId) || res.data[0];
        setSelectedStudent(defaultStudent);
        fetchConsent(defaultStudent._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchConsent = async (studentId) => {
    try {
      const res = await axios.get(`/api/consent/${studentId}`);
      setConsentStatus(res.data);
      setSigned(res.data.signed || false);
      setSignature(res.data.parentSignatureText || '');
      setTerms({
        acceptTutoring: res.data.signed || false,
        weeklyCheckin: res.data.signed || false,
        shareData: res.data.signed || false
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (e) => {
    const student = students.find(s => s._id === e.target.value);
    setSelectedStudent(student);
    setLoading(true);
    fetchConsent(student._id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!terms.acceptTutoring || !terms.weeklyCheckin || !terms.shareData) {
      setMessage('Please accept all consent terms and conditions.');
      return;
    }
    if (!signature.trim()) {
      setMessage('Please write your full name in the signature box.');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      const res = await axios.post('/api/consent', {
        studentId: selectedStudent._id,
        signed: true,
        parentSignatureText: signature
      });
      setConsentStatus(res.data);
      setSigned(true);
      setMessage('Consent form signed successfully! Dynamic redirection activated.');
      setTimeout(() => {
        navigate('/check-in');
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to submit consent.');
    } finally {
      setSaving(false);
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
    <div class="max-w-md mx-auto space-y-4">
      {/* Selector */}
      {students.length > 1 && (
        <div class="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
          <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Select Child / बच्चा चुनें</label>
          <select
            value={selectedStudent?._id || ''}
            onChange={handleStudentChange}
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
      ) : (
        <div class="bg-white rounded-2xl shadow-md border border-amber-100 overflow-hidden">
          {/* Header */}
          <div class="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white">
            <h2 class="text-lg font-bold">📄 Consent Form / सहमति पत्र</h2>
            <p class="text-xs text-amber-100">Student: {selectedStudent.name} (Grade {selectedStudent.grade})</p>
          </div>

          <div class="p-5 sm:p-6 space-y-5">
            {message && (
              <div class={`p-3 rounded-lg text-sm border ${signed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {message}
              </div>
            )}

            {signed ? (
              <div class="text-center py-6 space-y-3">
                <div class="text-4xl">✅</div>
                <h3 class="text-lg font-bold text-emerald-800">Consent Signed / सहमति दी गई है</h3>
                <p class="text-sm text-slate-500 max-w-xs mx-auto">
                  You have already signed the consent form for <strong>{selectedStudent.name}</strong>. You can perform weekly check-ins.
                </p>
                <button
                  onClick={() => navigate('/check-in')}
                  class="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-5 rounded-lg text-sm transition"
                >
                  Go to Weekend Check-in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} class="space-y-4">
                <div class="text-xs text-slate-500 leading-relaxed bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  ⚠️ <strong>Parents:</strong> Please read and check the following points to allow your child to participate in GyanMitra.
                </div>

                {/* Consent Items */}
                <div class="space-y-3">
                  <label class="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={terms.acceptTutoring}
                      onChange={(e) => setTerms({ ...terms, acceptTutoring: e.target.checked })}
                      class="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div class="text-xs sm:text-sm">
                      <p class="font-semibold text-slate-800">Tutoring Participation</p>
                      <p class="text-slate-500 text-xs">I allow my child to study with senior tutors. / मैं अपने बच्चे को ट्यूशन सत्र में भाग लेने की अनुमति देता हूँ।</p>
                    </div>
                  </label>

                  <label class="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={terms.weeklyCheckin}
                      onChange={(e) => setTerms({ ...terms, weeklyCheckin: e.target.checked })}
                      class="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div class="text-xs sm:text-sm">
                      <p class="font-semibold text-slate-800">Weekly Weekend Check-ins</p>
                      <p class="text-slate-500 text-xs">I agree to sit with my child on weekends for a 5-minute quiz check. / मैं सप्ताहांत पर बच्चे के साथ बैठकर 5 मिनट का क्विज़ पूरा करने के लिए सहमत हूँ।</p>
                    </div>
                  </label>

                  <label class="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={terms.shareData}
                      onChange={(e) => setTerms({ ...terms, shareData: e.target.checked })}
                      class="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div class="text-xs sm:text-sm">
                      <p class="font-semibold text-slate-800">Learning Progress Sharing</p>
                      <p class="text-slate-500 text-xs">I authorize sharing progress metrics with school coordinators. / मैं स्कूल समन्वयक के साथ सीखने के स्तर साझा करने की अनुमति देता हूँ।</p>
                    </div>
                  </label>
                </div>

                {/* Signature input */}
                <div class="border-t border-slate-100 pt-4">
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Parent Signature / अभिभावक के हस्ताक्षर
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Type your full name (ई-हस्ताक्षर हेतु अपना नाम लिखें)"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg text-sm shadow transition disabled:opacity-50"
                >
                  {saving ? 'Signing...' : 'Sign & Submit Consent / सहमति दर्ज करें'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsentForm;
