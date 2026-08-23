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
      setMessage('Consent form signed successfully! Redirection activated.');
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      {/* Selector */}
      {students.length > 1 && (
        <div className="bg-white rounded border border-slate-200 p-5 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Child / बच्चा चुनें</label>
          <select
            value={selectedStudent?._id || ''}
            onChange={handleStudentChange}
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
      ) : (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Consent Form / सहमति पत्र</h2>
            <p className="text-xs text-slate-400 mt-1">Student: {selectedStudent.name} (Grade {selectedStudent.grade})</p>
          </div>

          <div className="p-6 space-y-6">
            {message && (
              <div className={`p-4 rounded text-xs border ${signed ? 'bg-emerald-50 text-emerald-850 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {message}
              </div>
            )}

            {signed ? (
              <div className="text-center py-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Consent Signed / सहमति दी गई है</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  You have already signed the consent form for <strong>{selectedStudent.name}</strong>. You can perform weekly check-ins.
                </p>
                <button
                  onClick={() => navigate('/check-in')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-5 rounded text-xs uppercase tracking-wider transition"
                >
                  Go to Weekend Check-in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded border border-slate-200">
                  <strong>Parents:</strong> Please read and check the following points to allow your child to participate in GyanMitra.
                </div>

                {/* Consent Items */}
                <div className="space-y-4">
                  <label className="flex items-start space-x-4 p-3 hover:bg-slate-50 rounded cursor-pointer transition border border-slate-100">
                    <input
                      type="checkbox"
                      checked={terms.acceptTutoring}
                      onChange={(e) => setTerms({ ...terms, acceptTutoring: e.target.checked })}
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-950"
                    />
                    <div className="text-xs sm:text-sm">
                      <p className="font-semibold text-slate-700">Tutoring Participation</p>
                      <p className="text-slate-400 text-xs mt-1">I allow my child to study with senior tutors. / मैं अपने बच्चे को ट्यूशन सत्र में भाग लेने की अनुमति देता हूँ।</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-4 p-3 hover:bg-slate-50 rounded cursor-pointer transition border border-slate-100">
                    <input
                      type="checkbox"
                      checked={terms.weeklyCheckin}
                      onChange={(e) => setTerms({ ...terms, weeklyCheckin: e.target.checked })}
                      className="mt-1 h-5 w-5 rounded border-slate-350 text-slate-900 focus:ring-slate-950"
                    />
                    <div className="text-xs sm:text-sm">
                      <p className="font-semibold text-slate-700">Weekly Weekend Check-ins</p>
                      <p className="text-slate-400 text-xs mt-1">I agree to sit with my child on weekends for a 5-minute quiz check. / मैं सप्ताहांत पर बच्चे के साथ बैठकर 5 मिनट का क्विज़ पूरा करने के लिए सहमत हूँ।</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-4 p-3 hover:bg-slate-50 rounded cursor-pointer transition border border-slate-100">
                    <input
                      type="checkbox"
                      checked={terms.shareData}
                      onChange={(e) => setTerms({ ...terms, shareData: e.target.checked })}
                      className="mt-1 h-5 w-5 rounded border-slate-350 text-slate-900 focus:ring-slate-950"
                    />
                    <div className="text-xs sm:text-sm">
                      <p className="font-semibold text-slate-700">Learning Progress Sharing</p>
                      <p className="text-slate-400 text-xs mt-1">I authorize sharing progress metrics with school coordinators. / मैं स्कूल समन्वयक के साथ सीखने के स्तर साझा करने की अनुमति देता हूँ।</p>
                    </div>
                  </label>
                </div>

                {/* Signature input */}
                <div className="border-t border-slate-200 pt-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Parent Signature / अभिभावक के हस्ताक्षर
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Type your full name (ई-हस्ताक्षर हेतु अपना नाम लिखें)"
                    className="w-full px-4 py-3 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded text-xs uppercase tracking-wider transition disabled:opacity-50"
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

