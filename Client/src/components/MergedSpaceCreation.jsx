import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  Sparkles, Plus, Trash2, Upload, X, Heart, Settings, ArrowLeft,
  ArrowRight, Check, MessageSquare, RefreshCw, Eye, Video,
  Camera, Film, RotateCcw, Square, Circle, ChevronDown, Zap
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
  return json.secure_url || json.url;
};

const BUSINESS_TYPES = [
  'SaaS / Software Tool','E-commerce / Online Store','Coaching / Consulting',
  'Agency / Freelance Services','Mobile App','Online Course / Education',
  'Healthcare / Wellness','Restaurant / Food & Beverage','Real Estate',
  'Non-profit / NGO','Marketplace / Platform','Physical Product / Brand','Other',
];

const AUDIENCE_TYPES = [
  'Small Business Owners','Enterprise / Corporate','Freelancers / Solopreneurs',
  'Developers / Tech Teams','Designers / Creatives','Students / Learners',
  'Consumers / General Public','Healthcare Professionals','Marketing / Growth Teams',
  'Startup Founders','Parents / Families','Seniors / 50+','Other',
];

// ─── Live Preview ──────────────────────────────────────────────────────────────
const LivePreview = ({ formData, activeTab, thankYouData }) => {
  if (activeTab === 'thankyou') {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900/80 border-b border-gray-800">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          <span className="text-gray-600 text-xs ml-2">Thank You Preview</span>
        </div>
        <div className="p-6 text-center">
          {!thankYouData.hideImage && thankYouData.imagePreview && (
            <img src={thankYouData.imagePreview} alt="thankyou" className="w-24 h-24 mx-auto rounded-2xl object-cover mb-4 shadow-lg border border-gray-700" />
          )}
          <h2 className="text-xl font-bold text-white mb-2">{thankYouData.thankyouTitle || 'Thank you! 🎉'}</h2>
          <p className="text-gray-400 text-xs leading-relaxed">{thankYouData.thankyouMessage || 'Your testimonial means a ton!'}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900/80 border-b border-gray-800">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        <span className="text-gray-600 text-xs ml-2 truncate">testiqra.io/{formData.spacename || 'your-space'}</span>
      </div>
      <div className="p-5 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
          <img src={formData.imageUrl || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'} alt="" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-base font-bold text-white mb-1.5">{formData.header || 'Your header goes here...'}</h2>
        <p className="text-gray-500 text-xs mb-3 leading-relaxed">{formData.customMessage || 'Your custom message...'}</p>
        {formData.questions.length > 0 && (
          <div className="text-left bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Questions</p>
            <ul className="space-y-1">
              {formData.questions.slice(0, 3).map((q, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                  <span className="text-violet-400 mt-0.5 shrink-0">•</span>
                  <span className="line-clamp-1">{q || `Question ${i + 1}`}</span>
                </li>
              ))}
              {formData.questions.length > 3 && <p className="text-gray-600 text-xs">+{formData.questions.length - 3} more</p>}
            </ul>
          </div>
        )}
        <button className="w-full py-2 bg-violet-600 text-white text-xs rounded-xl font-bold">Share Testimonial</button>
      </div>
    </div>
  );
};

// ─── Select Dropdown ──────────────────────────────────────────────────────────
const SelectField = ({ label, value, onChange, options, placeholder }) => (
  <div>
    {label && <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">{label}</label>}
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl pl-4 pr-10 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer"
      >
        <option value="" disabled>{placeholder || 'Select an option'}</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
        ))}
      </select>
      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
function MergedSpaceCreation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'ai' ? 'ai' : 'scratch';

  const [activeTab, setActiveTab] = useState('basic');
  const [creationMode, setCreationMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [headerError, setHeaderError] = useState(false);
  const fileRef = useRef(null);
  const thankyouFileRef = useRef(null);

  const [aiStep, setAiStep] = useState(1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({ name: '', type: '', audience: '', product: '' });

  const [basicFormData, setBasicFormData] = useState({
    spacename: '',
    imageUrl: '',
    header: '',
    customMessage: '',
    questions: [
      'Who are you / what are you working on?',
      'How has our product/service helped you?',
      'What is the best thing about our product/service?',
    ],
    allowVideo: true,
    videoMaxDuration: 120,
  });

  const [thankYouFormData, setThankYouFormData] = useState({
    imagePreview: '',
    thankyouTitle: 'Thank you! 🎉',
    thankyouMessage: 'Thank you so much for your shoutout! It means a ton for us! 🙏',
    hideImage: false,
    redirect_url: '',
  });

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

  const generateBasicContent = async () => {
    if (!companyInfo.name) { toast.error('Company name is required'); return; }
    if (!companyInfo.type) { toast.error('Please select a business type'); return; }
    setAiGenerating(true);
    try {
      const prompt = `Generate testimonial collection content for:
Company: ${companyInfo.name}
Type: ${companyInfo.type}
Target Audience: ${companyInfo.audience || 'general customers'}
Product/Service: ${companyInfo.product || 'not specified'}
Return ONLY valid JSON:
{"header":"compelling header under 35 chars","customMessage":"warm 2-3 sentence message","questions":["q1","q2","q3","q4","q5"]}`;
      const response = await axios.post(`${BACKEND_URL}/api/v1/ai`, { prompt });
      const raw = response.data.result;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!parsed.header || !parsed.questions) throw new Error('Incomplete AI response');
      setBasicFormData(p => ({
        ...p,
        header: parsed.header.slice(0, 35),
        customMessage: parsed.customMessage || p.customMessage,
        questions: Array.isArray(parsed.questions) ? parsed.questions : p.questions,
        spacename: p.spacename || companyInfo.name.toLowerCase().replace(/\s+/g, '-'),
      }));
      setAiStep(2);
      toast.success('Content generated!');
    } catch (e) {
      toast.error(e.response?.data?.details || 'Failed to generate. Try again.');
    } finally { setAiGenerating(false); }
  };

  const generateThankYouContent = async () => {
    setAiGenerating(true);
    try {
      const prompt = `Generate thank you page content for Company: ${companyInfo.name}, Type: ${companyInfo.type}. Return ONLY valid JSON: {"thankyouTitle":"short thank you title","thankyouMessage":"warm 2 sentence message"}`;
      const response = await axios.post(`${BACKEND_URL}/api/v1/ai`, { prompt });
      let raw = response.data.result || '{}';
      raw = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);
      setThankYouFormData(p => ({
        ...p,
        thankyouTitle: parsed.thankyouTitle || p.thankyouTitle,
        thankyouMessage: parsed.thankyouMessage || p.thankyouMessage,
      }));
      setAiStep(3);
      setAiApplied(true);
      toast.success('Thank you content generated!');
    } catch (e) {
      toast.error('Failed to generate thank you content');
    } finally { setAiGenerating(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!basicFormData.spacename) { toast.error('Space name is required'); return; }
    if (!basicFormData.header) { toast.error('Header title is required'); return; }
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/v1/space-creation`,
        { ...basicFormData, ...thankYouFormData },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.message) {
        toast.success(res.data.message);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating space');
    } finally { setIsLoading(false); }
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

  // Input class reused
  const inputCls = "w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors";
  const cardCls = "bg-gray-900/60 border border-gray-800 rounded-2xl p-5";

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/8 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Navbar */}
      <nav className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft size={15} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <span className="font-bold text-lg">TestiQra</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 relative">
        <div className="flex gap-8">

          {/* Left: Live Preview */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-xs mb-3 font-medium">
                <Eye size={11} /> Live Preview
              </div>
              <LivePreview formData={basicFormData} activeTab={activeTab} thankYouData={thankYouFormData} />
            </div>
          </div>

          {/* Right: Form */}
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Create a New Space</h1>
              <p className="text-gray-400">Set up your testimonial collection page</p>
            </div>

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => { setCreationMode('scratch'); setAiStep(1); setAiApplied(false); }}
                className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all border-2 ${creationMode === 'scratch'
                  ? 'border-violet-500/60 bg-violet-500/8'
                  : 'border-gray-800 bg-gray-900/40 hover:bg-gray-900/60'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${creationMode === 'scratch' ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-gray-800 border border-gray-700'}`}>
                  <Settings size={18} className={creationMode === 'scratch' ? 'text-violet-400' : 'text-gray-500'} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">From Scratch</p>
                  <p className="text-gray-500 text-xs">Full customisation</p>
                </div>
              </button>
              <button onClick={() => { setCreationMode('ai'); setAiStep(1); }}
                className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all border-2 ${creationMode === 'ai'
                  ? 'border-amber-500/60 bg-amber-500/8'
                  : 'border-gray-800 bg-gray-900/40 hover:bg-gray-900/60'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${creationMode === 'ai' ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-gray-800 border border-gray-700'}`}>
                  <Sparkles size={18} className={creationMode === 'ai' ? 'text-amber-400' : 'text-gray-500'} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Create with AI</p>
                  <p className="text-gray-500 text-xs">AI-powered setup</p>
                </div>
              </button>
            </div>

            {/* AI Step 1 */}
            {creationMode === 'ai' && aiStep === 1 && (
              <div className="bg-gray-900/60 border border-amber-500/20 rounded-2xl overflow-hidden mb-6">
                <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                    <Sparkles size={15} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Tell AI about your business</h3>
                    <p className="text-gray-500 text-xs">We'll craft the perfect content for you</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">Company / Brand Name *</label>
                    <input value={companyInfo.name} onChange={e => setCompanyInfo(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Acme Corp"
                      className={inputCls.replace('focus:border-violet-500/50','focus:border-amber-500/50')} />
                  </div>
                  <SelectField label="Business Type *" value={companyInfo.type}
                    onChange={val => setCompanyInfo(p => ({ ...p, type: val }))}
                    options={BUSINESS_TYPES} placeholder="Select your business type" />
                  <SelectField label="Primary Target Audience" value={companyInfo.audience}
                    onChange={val => setCompanyInfo(p => ({ ...p, audience: val }))}
                    options={AUDIENCE_TYPES} placeholder="Select your target audience" />
                  <div>
                    <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">Main Product / Service (optional)</label>
                    <input value={companyInfo.product} onChange={e => setCompanyInfo(p => ({ ...p, product: e.target.value }))}
                      placeholder="e.g. Project management software"
                      className={inputCls.replace('focus:border-violet-500/50','focus:border-amber-500/50')} />
                  </div>
                  <button onClick={generateBasicContent} disabled={aiGenerating || !companyInfo.name || !companyInfo.type}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold rounded-xl transition-all text-sm shadow-lg shadow-amber-500/20">
                    {aiGenerating
                      ? <><RefreshCw size={15} className="animate-spin" /> Generating content…</>
                      : <><Sparkles size={15} /> Generate My Space Content</>}
                  </button>
                </div>
              </div>
            )}

            {/* AI Step 2+ */}
            {creationMode === 'ai' && aiStep >= 2 && (
              <div className="bg-gray-900/60 border border-emerald-500/20 rounded-2xl overflow-hidden mb-6">
                <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-medium">AI content generated for <span className="text-white">{companyInfo.name}</span></span>
                  </div>
                  <button onClick={() => { setAiStep(1); setAiApplied(false); }}
                    className="text-gray-500 text-xs hover:text-white transition-colors">Re-generate</button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Header</p>
                      <p className="text-white text-xs font-medium">{basicFormData.header}</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Questions</p>
                      <p className="text-gray-300 text-xs">{basicFormData.questions.length} generated</p>
                    </div>
                  </div>
                  {aiStep === 2 && (
                    <button onClick={generateThankYouContent} disabled={aiGenerating}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/15 border border-amber-500/25 hover:bg-amber-500/25 text-amber-400 rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                      {aiGenerating
                        ? <><RefreshCw size={13} className="animate-spin" /> Generating…</>
                        : <><Sparkles size={13} /> Also Generate Thank You Page →</>}
                    </button>
                  )}
                  {aiStep === 3 && (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
                      <Check size={13} className="text-emerald-400 shrink-0" />
                      <span className="text-emerald-400 text-xs">Thank you page content also applied.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabs */}
            {(creationMode === 'scratch' || aiStep >= 2) && (
              <>
                <div className="flex gap-1 p-1 bg-gray-900/60 border border-gray-800 rounded-xl mb-5">
                  {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                        ? 'bg-violet-600/20 border border-violet-500/30 text-violet-400'
                        : 'text-gray-500 hover:text-white'}`}>
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {activeTab === 'basic' && (
                    <div className="space-y-4">
                      {/* Space Name */}
                      <div className={cardCls}>
                        <label className="text-white font-semibold text-sm block mb-1">Space Name *</label>
                        <p className="text-gray-500 text-xs mb-3">This becomes your public URL</p>
                        <input value={basicFormData.spacename}
                          onChange={e => setBasicFormData(p => ({ ...p, spacename: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                          placeholder="my-awesome-product" className={inputCls} />
                        <p className="text-gray-600 text-xs mt-1.5">testimonial.to/{basicFormData.spacename || 'your-space'}</p>
                      </div>

                      {/* Logo */}
                      <div className={cardCls}>
                        <label className="text-white font-semibold text-sm block mb-3">Space Logo</label>
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl border border-gray-700 bg-gray-800 overflow-hidden">
                            <img src={basicFormData.imageUrl || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex gap-2">
                            <input ref={fileRef} type="file" accept="image/*" className="hidden"
                              onChange={e => handleFileUpload(e, url => setBasicFormData(p => ({ ...p, imageUrl: url })))} />
                            <button type="button" onClick={() => fileRef.current?.click()}
                              className="flex items-center gap-2 px-4 py-2 bg-violet-600/15 border border-violet-500/30 text-violet-400 rounded-xl text-sm hover:bg-violet-600/25 transition-colors">
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
                      <div className={cardCls}>
                        <label className="text-white font-semibold text-sm block mb-1">Header Title *</label>
                        <p className="text-gray-500 text-xs mb-3">Main heading customers see (max 35 chars)</p>
                        <input value={basicFormData.header} onChange={handleHeaderChange} maxLength={36}
                          placeholder="Share your experience with us!"
                          className={`w-full bg-gray-800/60 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none transition-colors ${headerError ? 'border-red-500/60' : 'border-gray-700/50 focus:border-violet-500/50'}`} />
                        <div className="flex justify-between mt-1.5">
                          {headerError && <p className="text-red-400 text-xs">Max 35 characters</p>}
                          <p className={`text-xs ml-auto ${basicFormData.header.length > 30 ? 'text-amber-400' : 'text-gray-600'}`}>
                            {basicFormData.header.length}/35
                          </p>
                        </div>
                      </div>

                      {/* Custom Message */}
                      <div className={cardCls}>
                        <label className="text-white font-semibold text-sm block mb-1">Custom Message</label>
                        <p className="text-gray-500 text-xs mb-3">Guide customers on writing great testimonials</p>
                        <textarea rows={4} value={basicFormData.customMessage}
                          onChange={e => setBasicFormData(p => ({ ...p, customMessage: e.target.value }))}
                          placeholder="Write a warm message to your customers..."
                          className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none" />
                      </div>

                      {/* Video */}
                      <div className={cardCls}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <label className="text-white font-semibold text-sm">Allow Video Testimonials</label>
                            <p className="text-gray-500 text-xs mt-0.5">Customers can record or upload video</p>
                          </div>
                          <button type="button" onClick={() => setBasicFormData(p => ({ ...p, allowVideo: !p.allowVideo }))}
                            className={`relative w-11 h-6 rounded-full transition-colors ${basicFormData.allowVideo ? 'bg-violet-600' : 'bg-gray-700'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${basicFormData.allowVideo ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        {basicFormData.allowVideo && (
                          <div>
                            <p className="text-gray-500 text-xs mb-2">Max video duration</p>
                            <div className="flex gap-2 flex-wrap">
                              {durationOptions.map(opt => (
                                <button key={opt.value} type="button"
                                  onClick={() => setBasicFormData(p => ({ ...p, videoMaxDuration: opt.value }))}
                                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${basicFormData.videoMaxDuration === opt.value
                                    ? 'bg-violet-600/20 border-violet-500/40 text-violet-400'
                                    : 'bg-gray-800/60 border-gray-700/50 text-gray-500 hover:border-gray-600 hover:text-white'}`}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Questions */}
                      <div className={cardCls}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <label className="text-white font-semibold text-sm">Questions</label>
                            <p className="text-gray-500 text-xs mt-0.5">Prompts shown to customers</p>
                          </div>
                          <button type="button" onClick={() => setBasicFormData(p => ({ ...p, questions: [...p.questions, ''] }))}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/15 border border-violet-500/30 text-violet-400 rounded-lg text-xs hover:bg-violet-600/25 transition-colors">
                            <Plus size={12} /> Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {basicFormData.questions.map((q, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 text-xs shrink-0">{i + 1}</span>
                              <input value={q}
                                onChange={e => {
                                  const next = [...basicFormData.questions];
                                  next[i] = e.target.value;
                                  setBasicFormData(p => ({ ...p, questions: next }));
                                }}
                                placeholder={`Question ${i + 1}`}
                                className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors" />
                              <button type="button"
                                onClick={() => setBasicFormData(p => ({ ...p, questions: p.questions.filter((_, qi) => qi !== i) }))}
                                className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'thankyou' && (
                    <div className="space-y-4">
                      <div className={cardCls}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <label className="text-white font-semibold text-sm">Thank You Image</label>
                            <p className="text-gray-500 text-xs mt-0.5">Displayed on the confirmation page</p>
                          </div>
                          <button type="button" onClick={() => setThankYouFormData(p => ({ ...p, hideImage: !p.hideImage }))}
                            className={`relative w-11 h-6 rounded-full transition-colors ${!thankYouFormData.hideImage ? 'bg-violet-600' : 'bg-gray-700'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${!thankYouFormData.hideImage ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        {!thankYouFormData.hideImage && (
                          <div className="flex items-center gap-4">
                            {thankYouFormData.imagePreview && (
                              <img src={thankYouFormData.imagePreview} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-700" />
                            )}
                            <div className="flex gap-2">
                              <input ref={thankyouFileRef} type="file" accept="image/*" className="hidden"
                                onChange={e => handleFileUpload(e, url => setThankYouFormData(p => ({ ...p, imagePreview: url })))} />
                              <button type="button" onClick={() => thankyouFileRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-violet-600/15 border border-violet-500/30 text-violet-400 rounded-xl text-sm hover:bg-violet-600/25 transition-colors">
                                <Upload size={13} /> {thankYouFormData.imagePreview ? 'Change' : 'Upload'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={cardCls}>
                        <label className="text-white font-semibold text-sm block mb-3">Thank You Title</label>
                        <input value={thankYouFormData.thankyouTitle}
                          onChange={e => setThankYouFormData(p => ({ ...p, thankyouTitle: e.target.value }))}
                          placeholder="Thank you! 🎉" className={inputCls} />
                      </div>

                      <div className={cardCls}>
                        <label className="text-white font-semibold text-sm block mb-3">Thank You Message</label>
                        <textarea rows={4} value={thankYouFormData.thankyouMessage}
                          onChange={e => setThankYouFormData(p => ({ ...p, thankyouMessage: e.target.value }))}
                          placeholder="Thank you so much for your shoutout!"
                          className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none" />
                      </div>

                      <div className={cardCls}>
                        <label className="text-white font-semibold text-sm block mb-1">Redirect URL (optional)</label>
                        <p className="text-gray-500 text-xs mb-3">Send customers to your site after submission</p>
                        <input value={thankYouFormData.redirect_url}
                          onChange={e => setThankYouFormData(p => ({ ...p, redirect_url: e.target.value }))}
                          placeholder="https://yourwebsite.com" className={inputCls} />
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={isLoading}
                    className="group w-full flex items-center justify-center gap-2 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all shadow-2xl shadow-violet-500/25">
                    {isLoading
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Space…</>
                      : <><Plus size={17} /> Create Space <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </form>
              </>
            )}

            {creationMode === 'ai' && aiStep === 1 && (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">Fill in the form above and click "Generate" to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toaster position="top-right" toastOptions={{
        style: { background: '#111827', color: '#fff', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px' }
      }} />
    </div>
  );
}

export default MergedSpaceCreation;