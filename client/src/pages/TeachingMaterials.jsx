import React, { useEffect, useState } from 'react';
import axios from 'axios';

const initialForm = {
  title: '',
  type: 'lesson_plan',
  subject: 'reading',
  grade: 'Grade 3',
  description: '',
  content: ''
};

function TeachingMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const fetchMaterials = async () => {
    try {
      const res = await axios.get('/api/teaching-materials');
      setMaterials(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/teaching-materials', form);
      setForm(initialForm);
      setShowForm(false);
      setMessage('Teaching material uploaded successfully.');
      fetchMaterials();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to upload teaching material.');
    }
  };

  const handleDownload = (material) => {
    const blob = new Blob([material.content || 'No content available'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${material.title.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">Teaching Materials Library</h2>
            <p className="mt-1 text-xs text-slate-500">Lesson plans, worksheets, assessments, and teaching tips for tutors.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded bg-slate-900 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white"
          >
            {showForm ? 'Close Form' : 'Upload Resource'}
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {message}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  placeholder="e.g. Grade 2 Reading Lesson"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  <option value="lesson_plan">Lesson Plan</option>
                  <option value="worksheet">Worksheet</option>
                  <option value="assessment">Assessment</option>
                  <option value="teaching_tip">Teaching Tip</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Subject</label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  <option value="reading">Reading</option>
                  <option value="math">Math</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Grade</label>
                <input
                  type="text"
                  name="grade"
                  value={form.grade}
                  onChange={handleChange}
                  className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  placeholder="Grade 3"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                placeholder="Short summary of this teaching resource"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Content</label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={8}
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                placeholder="Paste the lesson plan, worksheet questions, assessment checklist, or teaching tip here..."
              />
            </div>

            <button
              type="submit"
              className="rounded bg-slate-900 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white"
            >
              Save Resource
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {materials.map((material) => (
          <div key={material._id} className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{material.type.replace('_', ' ')}</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{material.title}</h3>
              </div>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                {material.subject}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-500">{material.grade}</p>
            <p className="mt-2 text-sm text-slate-600">{material.description || 'No description provided.'}</p>

            <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-line">
              {material.content.slice(0, 180)}{material.content.length > 180 ? '...' : ''}
            </div>

            <button
              type="button"
              onClick={() => handleDownload(material)}
              className="mt-4 rounded border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-700"
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeachingMaterials;
