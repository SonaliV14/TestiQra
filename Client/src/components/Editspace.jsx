import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  Sparkles, Plus, Trash2, Upload, X, Heart, Settings, ArrowLeft,
  Check, Eye, RefreshCw, ChevronDown
} from 'lucide-react';
import { BACKEND_URL } from '../utils/DB';

// ─── Cloudinary Upload ────────────────────────────────────────────────────────
const uploadToCloudinary = async (file, type = 'image') => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'testi_gatherer');
  data.append('cloud_name', 'dmxnc8pbu');
  const res = await fetch(`https://api.cloudinary.com/v1_1/dmxnc8pbu/${type}/upload`, { method: 'POST', body: data });
  const json = await res.json();
  return json.url || json.secure_url;
};

// ─── Live Preview ──────────────────────────────────────────────────────────────
const LivePreview = ({ formData, activeTab, thankYouData }) => {
  if (activeTab === 'thankyou') {
    return (
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-1.5 bg-white/3 flex items-center gap-1.5 px-3 border-b border-white/5">
          <div className="w-2 h-2 rounded-full bg-red-500/70" />
          <div className="w-2 h-2 rounded-full bg-amber-500/70" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
          <span className="text-gray-600 text-xs ml-2">Thank You Preview</span>
        </div>
        <div className="p-6 text-center">
          {!thankYouData.hideImage && thankYouData.imagePreview && (
            <img src={thankYouData.imagePreview} alt="thankyou" className="w-24 h-24 mx-auto rounded-2xl object-cover mb-4 shadow-lg border border-white/10" />
          )}
          <h2 className="text-xl font-bold text-white mb-2">{thankYouData.thankyouTitle || 'Thank you! 🎉'}</h2>
          <p className="text-gray-400 text-xs leading-relaxed">{thankYouData.thankyouMessage || 'Your testimonial means a ton!'}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
      <div className="p-1.5 bg-white/3 flex items-center gap-1.5 px-3 border-b border-white/5">
        <div className="w-2 h-2 rounded-full bg-red-500/70" />
        <div className="w-2 h-2 rounded-full bg-amber-500/70" />
        <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
        <span className="text-gray-600 text-xs ml-2 truncate">testiqra.io/{formData.spacename || 'your-space'}</span>
      </div>
      <div className="p-5 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-xl overflow-hidden border border-white/10 bg-[#111318]">
          <img src={formData.imageUrl || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'} alt="" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-base font-bold text-white mb-1.5">{formData.header || 'Your header goes here...'}</h2>
        <p className="text-gray-500 text-xs mb-3 leading-relaxed">{formData.customMessage || 'Your custom message...'}</p>
        {formData.questions.length > 0 && (
          <div className="text-left bg-white/3 border border-white/6 rounded-xl p-3 mb-3">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Questions</p>
            <ul className="space-y-1">
              {formData.questions.slice(0, 3).map((q, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                  <span className="text-cyan-400 mt-0.5 shrink-0">•</span>
                  <span className="line-clamp-1">{q || `Question ${i + 1}`}</span>
                </li>
              ))}
              {formData.questions.length > 3 && <p className="text-gray-700 text-xs">+{formData.questions.length - 3} more</p>}
            </ul>
          </div>
        )}
        <button className="w-full py-2 bg-cyan-400 text-black text-xs rounded-xl font-bold">Share Testimonial</button>
      </div>
    </div>
  );
};

function EditSpace() {
  const navigate = useNavigate();
  const { spaceName } = useParams();
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [headerError, setHeaderError] = useState(false);
  const fileRef = useRef(null);
  const thankyouFileRef = useRef(null);

  const [basicFormData, setBasicFormData] = useState({
    spacename: '',
    imageUrl: '',
    header: '',
    customMessage: '',
    questions: [],
    allowVideo: true,
    videoMaxDuration: 120,
  });

  const [thankYouFormData, setThankYouFormData] = useState({
    imagePreview: '',
    thankyouTitle: '',
    thankyouMessage: '',
    hideImage: false,
    redirect_url: ''
  });

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');

    const fetchSpaceData = async () => {
      if (!token) { navigate('/signin', { replace: true }); return; }
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/spaceinfo/edit`, {
          params: { spaceName },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        const spaceData = response.data.spaceinfo;
        if (!spaceData) { toast.error('Space not found'); navigate('/dashboard', { replace: true }); return; }

        const formattedQuestions = spaceData.questions.map(q =>
          typeof q === 'object' ? q.question : q
        );

        setBasicFormData({
          spacename: spaceData.space_name || '',
          imageUrl: spaceData.logo || '',
          header: spaceData.header || '',
          customMessage: spaceData.customMessage || '',
          questions: formattedQuestions || [],
          allowVideo: true,
          videoMaxDuration: 120,
        });

        setThankYouFormData({
          imagePreview: spaceData.thankyou_img_url || '',
          thankyouTitle: spaceData.thankyou_title || '',
          thankyouMessage: spaceData.thankyou_msg || '',
          hideImage: spaceData.hide_gif || false,
          redirect_url: spaceData.redirectPageUrl || ''
        });
      } catch (error) {
        if (!mounted) return;
        toast.error('Error fetching space data');
        navigate('/dashboard', { replace: true });
      }
    };

    if (spaceName) fetchSpaceData();
    return () => { mounted = false; };
  }, [spaceName, navigate]);

  const handleHeaderChange = (e) => {
    if (e.target.value.length <= 35) {
      setBasicFormData(p => ({ ...p, header: e.target.value }));
      setHeaderError(false);
    } else { setHeaderError(true); }
  };

  const handleFileUpload = async (e, setFn) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const url = await uploadToCloudinary(file, 'image');
      setFn(url);
    } catch { toast.error('Upload failed'); }
  };

  const handleUpdateSpace = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!basicFormData.spacename) { toast.error('Space name is required'); return; }
    if (!basicFormData.header) { toast.error('Header title is required'); return; }

    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin', { replace: true }); return; }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const payload = {
        spacename: basicFormData.spacename,
        imageUrl: basicFormData.imageUrl,
        header: basicFormData.header,
        customMessage: basicFormData.customMessage,
        questions: basicFormData.questions,
        hideImage: thankYouFormData.hideImage,
        redirect_url: thankYouFormData.redirect_url,
        imagePreview: thankYouFormData.imagePreview,
        thankyouTitle: thankYouFormData.thankyouTitle,
        thankyouMessage: thankYouFormData.thankyouMessage,
      };

      const updateResponse = await axios.put(
        `${BACKEND_URL}/api/v1/edit`,
        payload,
        {
          params: { spaceName },
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );

      if (updateResponse.data.message) {
        toast.success(updateResponse.data.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating space');
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Space Setup', icon: <Settings size={15} /> },
    { id: 'thankyou', label: 'Thank You', icon: <Heart size={15} /> },
  ];

  const durationOptions = [
    { label: '1 min', value: 60 },
    { label: '2 min', value: 120 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
  ];

  return (
    <div className="min-h-screen w-full bg-[#080a0f] py-8 px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');`}</style>

      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={15} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-400 flex items-center justify-center">
              <Sparkles size={13} className="text-black" />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }} className="text-white">TestiQra</span>
          </div>
        </div>

        <div className="flex gap-8">
          {/* ── Left: Live Preview ── */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-8">
              <p className="text-gray-600 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Eye size={11} /> Live Preview
              </p>
              <LivePreview formData={basicFormData} activeTab={activeTab} thankYouData={thankYouFormData} />
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }} className="text-3xl text-white mb-1">
                Edit Space
              </h1>
              <p className="text-gray-500 text-sm">Update your testimonial collection page</p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-[#0d1117] border border-white/6 rounded-xl mb-5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-400/20 border border-cyan-400/30 text-cyan-400'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleUpdateSpace} className="space-y-4">
              {/* ── BASIC TAB ── */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  {/* Space Name */}
                  <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-1">Space Name *</label>
                    <p className="text-gray-600 text-xs mb-3">This becomes your public URL</p>
                    <input
                      value={basicFormData.spacename}
                      onChange={e => setBasicFormData(p => ({ ...p, spacename: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                      placeholder="my-awesome-product"
                      className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
                    />
                    <p className="text-gray-700 text-xs mt-1.5">testimonial.to/{basicFormData.spacename || 'your-space'}</p>
                  </div>

                  {/* Logo */}
                  <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-3">Space Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl border border-white/10 bg-[#111318] overflow-hidden">
                        <img src={basicFormData.imageUrl || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-2">
                        <input ref={fileRef} type="file" accept="image/*" className="hidden"
                          onChange={e => handleFileUpload(e, url => setBasicFormData(p => ({ ...p, imageUrl: url })))} />
                        <button type="button" onClick={() => fileRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 rounded-xl text-sm hover:bg-cyan-400/20 transition-colors">
                          <Upload size={13} /> Upload
                        </button>
                        {basicFormData.imageUrl && (
                          <button type="button" onClick={() => setBasicFormData(p => ({ ...p, imageUrl: '' }))}
                            className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/20 transition-colors">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-1">Header Title *</label>
                    <p className="text-gray-600 text-xs mb-3">Main heading customers see (max 35 chars)</p>
                    <input
                      value={basicFormData.header}
                      onChange={handleHeaderChange}
                      maxLength={36}
                      placeholder="Share your experience with us!"
                      className={`w-full bg-gray-800/60 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none transition-colors ${
                        headerError ? 'border-red-500/60' : 'border-gray-700/50 focus:border-cyan-400/50'
                      }`}
                    />
                    <div className="flex justify-between mt-1.5">
                      {headerError && <p className="text-red-400 text-xs">Max 35 characters</p>}
                      <p className={`text-xs ml-auto ${basicFormData.header.length > 30 ? 'text-amber-400' : 'text-gray-700'}`}>
                        {basicFormData.header.length}/35
                      </p>
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-1">Custom Message</label>
                    <p className="text-gray-600 text-xs mb-3">Guide customers on writing great testimonials</p>
                    <textarea
                      rows={4}
                      value={basicFormData.customMessage}
                      onChange={e => setBasicFormData(p => ({ ...p, customMessage: e.target.value }))}
                      placeholder="Write a warm message to your customers..."
                      className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 transition-colors resize-none"
                    />
                  </div>

                  {/* Video toggle */}
                  <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-white font-medium text-sm">Allow Video Testimonials</label>
                        <p className="text-gray-600 text-xs mt-0.5">Customers can record or upload video</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBasicFormData(p => ({ ...p, allowVideo: !p.allowVideo }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${basicFormData.allowVideo ? 'bg-cyan-400' : 'bg-gray-700'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${basicFormData.allowVideo ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {basicFormData.allowVideo && (
                      <div>
                        <p className="text-gray-600 text-xs mb-2">Max video duration</p>
                        <div className="flex gap-2 flex-wrap">
                          {durationOptions.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setBasicFormData(p => ({ ...p, videoMaxDuration: opt.value }))}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                basicFormData.videoMaxDuration === opt.value
                                  ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-400'
                                  : 'bg-gray-800/60 border-gray-700/50 text-gray-500 hover:border-gray-600 hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Questions */}
                  <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-white font-medium text-sm">Questions</label>
                        <p className="text-gray-600 text-xs mt-0.5">Prompts shown to customers</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBasicFormData(p => ({ ...p, questions: [...p.questions, ''] }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 rounded-lg text-xs hover:bg-cyan-400/20 transition-colors"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {basicFormData.questions.map((q, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-gray-600 text-xs shrink-0">{i + 1}</span>
                          <input
                            value={q}
                            onChange={e => {
                              const next = [...basicFormData.questions];
                              next[i] = e.target.value;
                              setBasicFormData(p => ({ ...p, questions: next }));
                            }}
                            placeholder={`Question ${i + 1}`}
                            className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setBasicFormData(p => ({ ...p, questions: p.questions.filter((_, qi) => qi !== i) }))}
                            className="p-1.5 text-gray-700 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      {basicFormData.questions.length === 0 && (
                        <p className="text-gray-700 text-xs text-center py-3">No questions yet. Add some to guide your customers.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── THANK YOU TAB ── */}
              {activeTab === 'thankyou' && (
                <div className="space-y-4">
                  <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-white font-medium text-sm">Thank You Image</label>
                        <p className="text-gray-600 text-xs mt-0.5">Displayed on the confirmation page</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setThankYouFormData(p => ({ ...p, hideImage: !p.hideImage }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${!thankYouFormData.hideImage ? 'bg-cyan-400' : 'bg-gray-700'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${!thankYouFormData.hideImage ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {!thankYouFormData.hideImage && (
                      <div className="flex items-center gap-4">
                        {thankYouFormData.imagePreview && (
                          <img src={thankYouFormData.imagePreview} alt="" className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                        )}
                        <div className="flex gap-2">
                          <input ref={thankyouFileRef} type="file" accept="image/*" className="hidden"
                            onChange={e => handleFileUpload(e, url => setThankYouFormData(p => ({ ...p, imagePreview: url })))} />
                          <button type="button" onClick={() => thankyouFileRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 rounded-xl text-sm hover:bg-cyan-400/20 transition-colors">
                            <Upload size={13} /> {thankYouFormData.imagePreview ? 'Change' : 'Upload'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-3">Thank You Title</label>
                    <input
                      value={thankYouFormData.thankyouTitle}
                      onChange={e => setThankYouFormData(p => ({ ...p, thankyouTitle: e.target.value }))}
                      placeholder="Thank you! 🎉"
                      className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
                    />
                  </div>

                  <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-3">Thank You Message</label>
                    <textarea
                      rows={4}
                      value={thankYouFormData.thankyouMessage}
                      onChange={e => setThankYouFormData(p => ({ ...p, thankyouMessage: e.target.value }))}
                      placeholder="Thank you so much for your shoutout!"
                      className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 transition-colors resize-none"
                    />
                  </div>

                  <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-5">
                    <label className="text-white font-medium text-sm block mb-1">Redirect URL (optional)</label>
                    <p className="text-gray-600 text-xs mb-3">Send customers to your site after submission</p>
                    <input
                      value={thankYouFormData.redirect_url}
                      onChange={e => setThankYouFormData(p => ({ ...p, redirect_url: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                      className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed text-black rounded-2xl font-bold text-sm transition-all shadow-lg shadow-cyan-400/15"
              >
                {isLoading
                  ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Updating Space…</>
                  : <><Check size={17} /> Update Space</>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Toaster position="top-right" toastOptions={{
        style: { background: '#0d1117', color: '#fff', border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px' }
      }} />
    </div>
  );
}

export default EditSpace;