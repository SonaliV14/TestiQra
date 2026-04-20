import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast, { Toaster } from 'react-hot-toast';
import {
  Sparkles, X, ChevronDown, Search, Filter,
  ThumbsUp, ThumbsDown, Minus, Star, Video,
  FileText, Heart, Settings, BarChart2,
  MessageSquare, Lightbulb, Copy, Check,
  TrendingUp, AlertCircle, Smile, RefreshCw,
  GripVertical, Edit3, ExternalLink, Plus
} from 'lucide-react';

const BACKEND_URL = "http://localhost:3001";

// ─── Cloudinary video upload ────────────────────────────────────────────────
const uploadToCloudinary = async (file, resourceType = 'image') => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'testi_gatherer');
  data.append('cloud_name', 'dmxnc8pbu');
  const url = `https://api.cloudinary.com/v1_1/dmxnc8pbu/${resourceType}/upload`;
  const res = await fetch(url, { method: 'POST', body: data });
  const json = await res.json();
  return json.url || json.secure_url;
};

// ─── Star Rating ─────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <button key={s} type="button" onClick={() => onChange(s)}
        className={`transition-transform hover:scale-110 ${s <= value ? 'text-amber-400' : 'text-gray-600'}`}>
        <Star size={22} fill={s <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

// ─── AI Summary Modal ─────────────────────────────────────────────────────────
const AISummaryModal = ({ testimonials, onClose }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    if (!testimonials.length) {
      toast.error('No testimonials to summarise');
      return;
    }
    setLoading(true);
    try {
      const excerpts = testimonials.slice(0, 40).map((t, i) =>
        `[${i + 1}] Rating: ${t.Rating}/5 — "${t.Content}"`
      ).join('\n');

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a business analyst. Analyse these customer testimonials and return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "overallSentiment": "Positive|Mixed|Negative",
  "sentimentScore": <0-100 integer>,
  "keyPositives": ["string","string","string"],
  "keyComplaints": ["string","string","string"],
  "summary": "2-3 sentence executive summary"
}

Testimonials:
${excerpts}`
          }]
        })
      });

      const data = await response.json();
      const raw = data.content?.[0]?.text || '{}';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      setSummary(JSON.parse(cleaned));
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate summary – check your API access');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generateSummary(); }, []);

  const handleCopy = () => {
    if (!summary) return;
    const text = `Overall Sentiment: ${summary.overallSentiment} (${summary.sentimentScore}/100)\n\nSummary: ${summary.summary}\n\nKey Positives:\n${summary.keyPositives.map(p => `• ${p}`).join('\n')}\n\nKey Complaints:\n${summary.keyComplaints.map(c => `• ${c}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sentimentColor = {
    Positive: 'text-emerald-400',
    Mixed: 'text-amber-400',
    Negative: 'text-red-400',
  };

  const sentimentBg = {
    Positive: 'bg-emerald-400/10 border-emerald-400/20',
    Mixed: 'bg-amber-400/10 border-amber-400/20',
    Negative: 'bg-red-400/10 border-red-400/20',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles size={18} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">AI Testimonial Summary</h2>
              <p className="text-gray-400 text-sm">{testimonials.length} testimonials analysed</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generateSummary} disabled={loading}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all disabled:opacity-50">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <p className="text-gray-400 text-sm">Analysing testimonials with AI…</p>
            </div>
          )}

          {!loading && summary && (
            <>
              {/* Sentiment Badge */}
              <div className={`flex items-center gap-4 p-4 rounded-xl border ${sentimentBg[summary.overallSentiment] || 'bg-gray-800 border-gray-700'}`}>
                <div className="flex-1">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Overall Sentiment</p>
                  <p className={`text-2xl font-bold ${sentimentColor[summary.overallSentiment] || 'text-white'}`}>
                    {summary.overallSentiment}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Score</p>
                  <p className="text-3xl font-bold text-white">{summary.sentimentScore}<span className="text-gray-500 text-lg">/100</span></p>
                </div>
                {/* Score Bar */}
                <div className="w-24 hidden sm:block">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${summary.sentimentScore}%` }} />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BarChart2 size={12} /> Executive Summary
                </p>
                <p className="text-gray-200 text-sm leading-relaxed">{summary.summary}</p>
              </div>

              {/* Positives + Complaints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-400/5 border border-emerald-400/20 rounded-xl">
                  <p className="text-emerald-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ThumbsUp size={12} /> Key Positives
                  </p>
                  <ul className="space-y-2">
                    {summary.keyPositives.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-emerald-400 mt-0.5 shrink-0">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-red-400/5 border border-red-400/20 rounded-xl">
                  <p className="text-red-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ThumbsDown size={12} /> Key Complaints
                  </p>
                  <ul className="space-y-2">
                    {summary.keyComplaints.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-red-400 mt-0.5 shrink-0">✗</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Copy Button */}
              <button onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all font-medium text-sm">
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Summary</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── AI Question Suggester Modal ──────────────────────────────────────────────
const AIQuestionModal = ({ onClose, onApply }) => {
  const [businessType, setBusinessType] = useState('');
  const [audience, setAudience] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);

  const generate = async () => {
    if (!businessType.trim()) { toast.error('Enter your business type'); return; }
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          messages: [{
            role: "user",
            content: `Generate 8 excellent testimonial collection questions for:
Business type: ${businessType}
Target audience: ${audience || 'general customers'}

Return ONLY a JSON array of 8 strings, no markdown, no explanation. Each question should be specific, open-ended, and help gather high-quality social proof. Example format:
["Question 1?","Question 2?","Question 3?","Question 4?","Question 5?","Question 6?","Question 7?","Question 8?"]`
          }]
        })
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text || '[]';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      setSuggestions(JSON.parse(cleaned));
    } catch (e) {
      toast.error('Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (q) => setSelected(s => s.includes(q) ? s.filter(x => x !== q) : [...s, q]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Lightbulb size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">AI Question Suggester</h2>
              <p className="text-gray-400 text-sm">Get tailored questions for your business</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">Business Type *</label>
              <input value={businessType} onChange={e => setBusinessType(e.target.value)}
                placeholder="e.g. SaaS tool, E-commerce store, Fitness studio…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">Target Audience</label>
              <input value={audience} onChange={e => setAudience(e.target.value)}
                placeholder="e.g. Small business owners, athletes, developers…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
            <button onClick={generate} disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><RefreshCw size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate Questions</>}
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Select questions to add</p>
              {suggestions.map((q, i) => (
                <button key={i} onClick={() => toggle(q)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${selected.includes(q) ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600'}`}>
                  <span className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs ${selected.includes(q) ? 'bg-amber-500 border-amber-500 text-gray-900' : 'border-gray-600'}`}>
                      {selected.includes(q) && '✓'}
                    </span>
                    {q}
                  </span>
                </button>
              ))}
              {selected.length > 0 && (
                <button onClick={() => { onApply(selected); onClose(); }}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                  <Plus size={16} /> Add {selected.length} Question{selected.length > 1 ? 's' : ''} to Space
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Video Testimonial Modal ──────────────────────────────────────────────────
const VideoTestimonialModal = ({ spaceinfo, spacename, onClose, onSuccess }) => {
  const [stage, setStage] = useState('preview'); // preview | record | upload | submit
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', rating: 5 });
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const videoPreviewRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        if (videoPreviewRef.current) { videoPreviewRef.current.srcObject = null; videoPreviewRef.current.src = url; }
        stream.getTracks().forEach(t => t.stop());
        setStage('submit');
      };
      mr.start();
      setRecording(true);
      setStage('record');
    } catch {
      toast.error('Camera/mic permission denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'video');
      setVideoUrl(url);
      setVideoBlob(null);
      setStage('submit');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const submitTestimonial = async () => {
    if (!form.username || !form.email) { toast.error('Fill in name and email'); return; }
    if (!videoUrl) { toast.error('No video attached'); return; }
    setUploading(true);
    try {
      let cloudUrl = videoUrl;
      if (videoBlob) {
        const file = new File([videoBlob], 'recording.webm', { type: 'video/webm' });
        cloudUrl = await uploadToCloudinary(file, 'video');
      }
      await axios.post(`${BACKEND_URL}/api/v1/sendtestimonials`,
        { testimonial: { ...form, isTextContent: false, content: '[Video Testimonial]', imageURL: '', UserImageURL: '' }, rating: form.rating, videoUrl: cloudUrl },
        { params: { spacename }, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }
      );
      toast.success('Video testimonial submitted!');
      onSuccess();
      onClose();
    } catch { toast.error('Submission failed'); }
    finally { setUploading(false); }
  };

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Video size={16} className="text-red-400" />
            </div>
            <h2 className="text-white font-semibold">Record Video Testimonial</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Video Preview */}
          <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
            {(stage === 'record' || stage === 'submit') ? (
              <video ref={videoPreviewRef} autoPlay muted={stage === 'record'} controls={stage === 'submit'}
                className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
                <Video size={40} />
                <p className="text-sm">Camera preview will appear here</p>
              </div>
            )}
            {recording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500/90 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-medium">REC</span>
              </div>
            )}
          </div>

          {/* Controls */}
          {stage === 'preview' && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={startRecording}
                className="flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all text-sm font-medium">
                <Video size={16} /> Start Recording
              </button>
              <label className="flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all text-sm font-medium cursor-pointer">
                <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                {uploading ? <RefreshCw size={16} className="animate-spin" /> : '📁'} Upload Video
              </label>
            </div>
          )}

          {stage === 'record' && (
            <button onClick={stopRecording}
              className="w-full py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-white rounded-sm" /> Stop Recording
            </button>
          )}

          {stage === 'submit' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Your name"
                  className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50" />
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Your email" type="email"
                  className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-2">Rating</p>
                <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
              </div>
              <button onClick={submitTestimonial} disabled={uploading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                {uploading ? <><RefreshCw size={16} className="animate-spin" /> Submitting…</> : '🚀 Submit Testimonial'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Testimonial Card ─────────────────────────────────────────────────────────
const TestimonialCard = ({ testimonial, onLike, index, isReordering }) => {
  const isVideo = !testimonial.isTextContent;

  return (
    <div className={`group bg-gray-800/60 backdrop-blur border rounded-2xl p-5 transition-all duration-200 hover:bg-gray-800 ${testimonial.liked ? 'border-rose-500/40 shadow-rose-500/5 shadow-lg' : 'border-gray-700/50 hover:border-gray-600'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <img src={testimonial.UserImageURL || `https://api.dicebear.com/7.x/initials/svg?seed=${testimonial.username}`}
            alt={testimonial.username}
            className="w-10 h-10 rounded-xl object-cover border border-gray-700" />
          <div>
            <p className="text-white font-medium text-sm">{testimonial.username}</p>
            <p className="text-gray-500 text-xs">{testimonial.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${isVideo ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
            {isVideo ? '📹 Video' : '📝 Text'}
          </span>
          {isReordering && <GripVertical size={16} className="text-gray-600" />}
          <button onClick={() => onLike(testimonial.id, testimonial.liked)}
            className={`p-1.5 rounded-lg transition-all ${testimonial.liked ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-rose-400'}`}>
            <Heart size={14} fill={testimonial.liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} size={14} className={s <= testimonial.Rating ? 'text-amber-400' : 'text-gray-700'} fill={s <= testimonial.Rating ? 'currentColor' : 'none'} />
        ))}
        <span className="text-gray-500 text-xs ml-2">{testimonial.Rating}/5</span>
      </div>

      {/* Content */}
      {isVideo && testimonial.videoUrl ? (
        <video src={testimonial.videoUrl} controls className="w-full rounded-xl mb-3 max-h-48 bg-black" />
      ) : (
        <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-3">{testimonial.Content}</p>
      )}

      {testimonial.imageURL && (
        <img src={testimonial.imageURL} alt="" className="w-full rounded-xl mb-3 max-h-48 object-cover border border-gray-700" />
      )}

      <p className="text-gray-600 text-xs">
        {new Date(testimonial.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  );
};

// ─── Main Space Component ─────────────────────────────────────────────────────
export default function Space() {
  const { spacename } = useParams();
  const navigate = useNavigate();
  const [spaceinfo, setSpaceinfo] = useState({ spaceinfo: { space_name: '', logo: '' } });
  const [testimonials, setTestimonials] = useState([]);
  const [display, setDisplay] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isReordering, setIsReordering] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [showAIQuestions, setShowAIQuestions] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, liked: 0, avgRating: 0, video: 0 });

  // Fetch space info
  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/v1/spaceinfo`, {
      params: { spacename },
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(r => setSpaceinfo(r.data)).catch(console.error);
  }, [spacename]);

  // Fetch testimonials
  const fetchTestimonials = useCallback(async () => {
    try {
      const r = await axios.get(`${BACKEND_URL}/api/v1/fetchtestimonials`, {
        params: { spacename },
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      const saved = JSON.parse(localStorage.getItem(`testimonial-order-${spacename}`) || '[]');
      let list = r.data.testimonials;
      if (saved.length) {
        const map = new Map(saved.map((id, i) => [id, i]));
        list = [...list].sort((a, b) => (map.get(a.id) ?? 999) - (map.get(b.id) ?? 999));
      }
      setTestimonials(list);
      // Stats
      const total = list.length;
      const liked = list.filter(t => t.liked).length;
      const avgRating = total ? (list.reduce((s, t) => s + t.Rating, 0) / total).toFixed(1) : 0;
      const video = list.filter(t => !t.isTextContent).length;
      setStats({ total, liked, avgRating, video });
    } catch (e) { console.error(e); }
  }, [spacename]);

  useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

  // Filter/search
  useEffect(() => {
    let list = [...testimonials];
    if (filter === 'liked') list = list.filter(t => t.liked);
    if (filter === 'video') list = list.filter(t => !t.isTextContent);
    if (filter === 'text') list = list.filter(t => t.isTextContent);
    if (search) list = list.filter(t =>
      t.username.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.Content?.toLowerCase().includes(search.toLowerCase())
    );
    setDisplay(list);
  }, [testimonials, filter, search]);

  const handleLike = async (id, isLiked) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, liked: !t.liked } : t));
    await axios.post(`${BACKEND_URL}/api/v1/liked`, { testimonialid: id, isLiked: !isLiked },
      { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const next = [...testimonials];
    const [item] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, item);
    localStorage.setItem(`testimonial-order-${spacename}`, JSON.stringify(next.map(t => t.id)));
    setTestimonials(next);
  };

  const filterTabs = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'liked', label: '❤️ Loved', count: stats.liked },
    { id: 'text', label: '📝 Text', count: stats.total - stats.video },
    { id: 'video', label: '📹 Video', count: stats.video },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white">
      <Toaster position="top-right" />
      {showAISummary && <AISummaryModal testimonials={testimonials} onClose={() => setShowAISummary(false)} />}
      {showAIQuestions && <AIQuestionModal onClose={() => setShowAIQuestions(false)} onApply={(qs) => toast.success(`${qs.length} questions ready – go to Edit Space to add them!`)} />}
      {showVideoModal && <VideoTestimonialModal spaceinfo={spaceinfo} spacename={spacename} onClose={() => setShowVideoModal(false)} onSuccess={fetchTestimonials} />}

      {/* ── Top Bar ── */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={spaceinfo.spaceinfo.logo || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'}
              alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-700" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">{spaceinfo.spaceinfo.space_name || spacename}</h1>
              <a href={`${BACKEND_URL}/testimonial.to/${spacename}`} target="_blank" rel="noreferrer"
                className="text-gray-500 text-xs hover:text-violet-400 transition-colors flex items-center gap-1">
                testimonial.to/{spacename} <ExternalLink size={10} />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAIQuestions(true)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 rounded-xl transition-all text-sm font-medium">
              <Lightbulb size={15} /> AI Questions
            </button>
            <button onClick={() => setShowAISummary(true)}
              className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 text-violet-400 rounded-xl transition-all text-sm font-medium">
              <Sparkles size={15} /> AI Summary
            </button>
            <button onClick={() => navigate(`/edit/${spacename}`)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-all text-sm border border-gray-700">
              <Edit3 size={15} /> Edit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Stats */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider">At a glance</p>
              {[
                { label: 'Total', value: stats.total, color: 'text-white' },
                { label: 'Liked', value: stats.liked, color: 'text-rose-400' },
                { label: 'Avg Rating', value: `${stats.avgRating}★`, color: 'text-amber-400' },
                { label: 'Videos', value: stats.video, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{s.label}</span>
                  <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-2">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Actions</p>
              <button onClick={() => setShowVideoModal(true)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium">
                <Video size={15} /> Add Video
              </button>
              <button onClick={() => setShowAISummary(true)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all text-sm font-medium">
                <Sparkles size={15} /> AI Summary
              </button>
              <button onClick={() => setShowAIQuestions(true)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-sm font-medium">
                <Lightbulb size={15} /> AI Questions
              </button>
              <button onClick={() => setIsReordering(r => !r)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${isReordering ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                <GripVertical size={15} /> {isReordering ? 'Done' : 'Reorder'}
              </button>
              <button onClick={() => navigate(`/testimonialwall/${spacename}`)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white transition-all text-sm">
                <ExternalLink size={15} /> Wall of Love
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Filter Tabs + Search */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {filterTabs.map(tab => (
                <button key={tab.id} onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${filter === tab.id ? 'bg-violet-600 border-violet-500 text-white' : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.id ? 'bg-white/20' : 'bg-gray-700'}`}>{tab.count}</span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2">
                <Search size={15} className="text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search testimonials…"
                  className="bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none w-48" />
                {search && <button onClick={() => setSearch('')}><X size={14} className="text-gray-500 hover:text-white" /></button>}
              </div>
            </div>

            {/* Mobile: Add Video button */}
            <button onClick={() => setShowVideoModal(true)}
              className="lg:hidden w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              <Video size={15} /> Record / Upload Video Testimonial
            </button>
          </div>

          {/* Testimonial Grid */}
          {display.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium mb-1">No testimonials yet</p>
              <p className="text-gray-600 text-sm">Share your space URL to start collecting reviews</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="testimonials">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}
                    className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {display.map((t, i) => (
                      <Draggable key={t.id} draggableId={String(t.id)} index={i} isDragDisabled={!isReordering}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-80 rotate-1 scale-105' : ''}>
                            <TestimonialCard testimonial={t} onLike={handleLike} index={i} isReordering={isReordering} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </main>
      </div>
    </div>
  );
}