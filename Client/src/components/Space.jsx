import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast, { Toaster } from 'react-hot-toast';
import {
  Sparkles, X, Search, Filter,
  ThumbsUp, ThumbsDown, Star,
  Heart, Settings, BarChart2,
  MessageSquare, Copy, Check,
  RefreshCw, GripVertical, Edit3,
  ExternalLink, Video, FileText,
  ChevronDown, Zap
} from 'lucide-react';

const BACKEND_URL = "http://localhost:3001";
const FRONTEND_URL = "http://localhost:5173";

// ─── Star Rating ─────────────────────────────────────────────────────────────
const StarRating = ({ value }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        size={13}
        className={s <= value ? 'text-amber-400' : 'text-gray-700'}
        fill={s <= value ? 'currentColor' : 'none'}
      />
    ))}
    <span className="text-gray-500 text-xs ml-1.5">{value}/5</span>
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
    setSummary(null); // reset on regenerate

    try {
      const excerpts = testimonials.slice(0, 40).map((t, i) =>
        `[${i + 1}] Rating: ${t.Rating}/5 — "${t.Content}"`
      ).join('\n');

      // ✅ FIX 1: Send just { prompt } — that's what AiRouter.js expects
      const response = await fetch(`${BACKEND_URL}/api/v1/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          prompt: `You are a business analyst. Analyse these customer testimonials and return ONLY valid JSON (no markdown, no backticks, no explanation) with this exact structure:
{
  "overallSentiment": "Positive",
  "sentimentScore": 85,
  "keyPositives": ["point one", "point two", "point three"],
  "keyComplaints": ["complaint one", "complaint two", "complaint three"],
  "summary": "2-3 sentence executive summary here."
}

Testimonials:
${excerpts}`
        })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      // ✅ FIX 2: Read data.result — that's what AiRouter.js returns
      const raw = data.result || '{}';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      // ✅ FIX 3: Guarantee every array field exists before .map() is called
      setSummary({
        overallSentiment: parsed.overallSentiment || 'Mixed',
        sentimentScore:   parsed.sentimentScore   ?? 50,
        summary:          parsed.summary          || 'No summary available.',
        keyPositives:     Array.isArray(parsed.keyPositives)  ? parsed.keyPositives  : [],
        keyComplaints:    Array.isArray(parsed.keyComplaints) ? parsed.keyComplaints : [],
      });

    } catch (e) {
      console.error('AI Summary error:', e);
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generateSummary(); }, []);

  const handleCopy = () => {
    if (!summary) return;
    const text = [
      `Overall Sentiment: ${summary.overallSentiment} (${summary.sentimentScore}/100)`,
      `\nSummary: ${summary.summary}`,
      `\nKey Positives:\n${summary.keyPositives.map(p => `• ${p}`).join('\n')}`,
      `\nKey Complaints:\n${summary.keyComplaints.map(c => `• ${c}`).join('\n')}`,
    ].join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sentimentColor = {
    Positive: 'text-emerald-400',
    Mixed:    'text-amber-400',
    Negative: 'text-red-400',
  };
  const sentimentBg = {
    Positive: 'bg-emerald-400/10 border-emerald-400/20',
    Mixed:    'bg-amber-400/10  border-amber-400/20',
    Negative: 'bg-red-400/10   border-red-400/20',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-400/15 border border-cyan-400/25 flex items-center justify-center">
              <Sparkles size={17} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">AI Testimonial Summary</h2>
              <p className="text-gray-500 text-xs">{testimonials.length} testimonials analysed</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generateSummary} disabled={loading}
              className="p-2 rounded-xl bg-white/4 hover:bg-white/8 text-gray-500 hover:text-white transition-all disabled:opacity-40">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose}
              className="p-2 rounded-xl bg-white/4 hover:bg-white/8 text-gray-500 hover:text-white transition-all">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <p className="text-gray-500 text-sm">Analysing with Gemini AI…</p>
            </div>
          )}

          {/* Result */}
          {!loading && summary && (
            <>
              {/* Sentiment bar */}
              <div className={`flex items-center gap-4 p-4 rounded-xl border ${sentimentBg[summary.overallSentiment] || 'bg-white/4 border-white/8'}`}>
                <div className="flex-1">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Overall Sentiment</p>
                  <p className={`text-2xl font-bold ${sentimentColor[summary.overallSentiment] || 'text-white'}`}>
                    {summary.overallSentiment}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Score</p>
                  <p className="text-3xl font-bold text-white">
                    {summary.sentimentScore}<span className="text-gray-600 text-lg">/100</span>
                  </p>
                </div>
                <div className="w-20 hidden sm:block">
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-700"
                      style={{ width: `${summary.sentimentScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Executive summary */}
              <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <BarChart2 size={11} /> Executive Summary
                </p>
                <p className="text-gray-200 text-sm leading-relaxed">{summary.summary}</p>
              </div>

              {/* Positives + Complaints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-400/5 border border-emerald-400/15 rounded-xl">
                  <p className="text-emerald-400 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ThumbsUp size={11} /> Key Positives
                  </p>
                  {summary.keyPositives.length === 0
                    ? <p className="text-gray-600 text-xs">None identified</p>
                    : (
                      <ul className="space-y-2">
                        {summary.keyPositives.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <span className="text-emerald-400 mt-0.5 shrink-0">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    )
                  }
                </div>
                <div className="p-4 bg-red-400/5 border border-red-400/15 rounded-xl">
                  <p className="text-red-400 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ThumbsDown size={11} /> Key Complaints
                  </p>
                  {summary.keyComplaints.length === 0
                    ? <p className="text-gray-600 text-xs">None identified</p>
                    : (
                      <ul className="space-y-2">
                        {summary.keyComplaints.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <span className="text-red-400 mt-0.5 shrink-0">✗</span> {c}
                          </li>
                        ))}
                      </ul>
                    )
                  }
                </div>
              </div>

              {/* Copy button */}
              <button onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl transition-all font-semibold text-sm">
                {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Summary</>}
              </button>
            </>
          )}

          {/* No testimonials fallback */}
          {!loading && !summary && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No summary generated yet.</p>
              <button onClick={generateSummary}
                className="mt-3 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 rounded-xl text-sm hover:bg-cyan-400/20 transition-all">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Testimonial Card ─────────────────────────────────────────────────────────
const TestimonialCard = ({ testimonial, onLike, isReordering }) => {
  const isVideo = !testimonial.isTextContent;

  return (
    <div className={`group bg-[#0d1117] border rounded-2xl p-5 transition-all duration-200 hover:bg-[#111318]
      ${testimonial.liked
        ? 'border-rose-500/30 shadow-rose-500/5 shadow-lg'
        : 'border-white/7 hover:border-white/12'}`}>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <img
            src={testimonial.UserImageURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(testimonial.username)}&backgroundColor=0d1117&textColor=06b6d4`}
            alt={testimonial.username}
            className="w-10 h-10 rounded-xl object-cover border border-white/10 bg-[#111318]"
          />
          <div>
            <p className="text-white font-medium text-sm">{testimonial.username}</p>
            <p className="text-gray-600 text-xs">{testimonial.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium
            ${isVideo
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
            {isVideo ? '📹 Video' : '📝 Text'}
          </span>
          {isReordering && <GripVertical size={15} className="text-gray-700" />}
          <button
            onClick={() => onLike(testimonial.id, testimonial.liked)}
            className={`p-1.5 rounded-xl transition-all
              ${testimonial.liked
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'bg-white/4 text-gray-600 hover:bg-white/8 hover:text-rose-400'}`}>
            <Heart size={13} fill={testimonial.liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <StarRating value={testimonial.Rating} />

      <div className="mt-3">
        {isVideo && testimonial.videoUrl
          ? <video src={testimonial.videoUrl} controls className="w-full rounded-xl mb-3 max-h-48 bg-black border border-white/8" />
          : <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 mt-2">{testimonial.Content}</p>
        }
      </div>

      {testimonial.imageURL && (
        <img src={testimonial.imageURL} alt="" className="w-full rounded-xl mt-3 max-h-48 object-cover border border-white/8" />
      )}

      <p className="text-gray-700 text-xs mt-3">
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
  const [stats, setStats] = useState({ total: 0, liked: 0, avgRating: 0, video: 0 });
  const [copied, setCopied] = useState(false);

  const shareableUrl = `${FRONTEND_URL}/testimonial.to/${spacename}`;

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

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
      let list = r.data.testimonials || [];
      if (saved.length) {
        const map = new Map(saved.map((id, i) => [id, i]));
        list = [...list].sort((a, b) => (map.get(a.id) ?? 999) - (map.get(b.id) ?? 999));
      }
      setTestimonials(list);
      const total = list.length;
      const liked = list.filter(t => t.liked).length;
      const avgRating = total ? (list.reduce((s, t) => s + t.Rating, 0) / total).toFixed(1) : 0;
      const video = list.filter(t => !t.isTextContent).length;
      setStats({ total, liked, avgRating, video });
    } catch (e) { console.error(e); }
  }, [spacename]);

  useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

  // Filter & search
  useEffect(() => {
    let list = [...testimonials];
    if (filter === 'liked') list = list.filter(t => t.liked);
    if (filter === 'video') list = list.filter(t => !t.isTextContent);
    if (filter === 'text') list = list.filter(t => t.isTextContent);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.username?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.Content?.toLowerCase().includes(q)
      );
    }
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
    { id: 'all',   label: 'All',       count: stats.total },
    { id: 'liked', label: '❤️ Loved',  count: stats.liked },
    { id: 'text',  label: '📝 Text',   count: stats.total - stats.video },
    { id: 'video', label: '📹 Video',  count: stats.video },
  ];

  return (
    <div className="min-h-screen w-full bg-[#080a0f] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');`}</style>

      <Toaster position="top-right" toastOptions={{
        style: { background: '#111318', color: '#fff', border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px' }
      }} />

      {showAISummary && (
        <AISummaryModal testimonials={testimonials} onClose={() => setShowAISummary(false)} />
      )}

      {/* ── Top Bar ── */}
      <div className="border-b border-white/6 bg-[#080a0f]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-400 flex items-center justify-center">
                <Zap size={13} fill="black" className="text-black" />
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }} className="text-white text-base">TestiQra</span>
            </div>

            <div className="w-px h-5 bg-white/10" />

            <div className="flex items-center gap-3">
              <img
                src={spaceinfo.spaceinfo?.logo || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'}
                alt="" className="w-8 h-8 rounded-lg object-cover border border-white/10 bg-[#111318]"
              />
              <div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
                  className="text-white text-base leading-tight">{spaceinfo.spaceinfo?.space_name || spacename}</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyShareUrl}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/4 border border-white/8 hover:bg-white/8 text-gray-400 hover:text-white rounded-xl transition-all text-xs font-medium max-w-xs truncate"
              title={shareableUrl}
            >
              <ExternalLink size={13} className="shrink-0" />
              <span className="truncate max-w-[180px]">{shareableUrl.replace('http://', '')}</span>
              {copied ? <Check size={12} className="text-cyan-400 shrink-0" /> : <Copy size={12} className="shrink-0" />}
            </button>

            <button
              onClick={() => setShowAISummary(true)}
              className="flex items-center gap-2 px-3 py-2 bg-cyan-400/10 border border-cyan-400/20 hover:bg-cyan-400/20 text-cyan-400 rounded-xl transition-all text-sm font-medium">
              <Sparkles size={14} /> AI Summary
            </button>

            <button
              onClick={() => navigate(`/edit/${spacename}`)}
              className="flex items-center gap-2 px-3 py-2 bg-white/4 border border-white/8 hover:bg-white/8 text-gray-400 hover:text-white rounded-xl transition-all text-sm">
              <Edit3 size={14} /> Edit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8">

        {/* ── Sidebar ── */}
        <aside className="w-52 shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="bg-[#0d1117] border border-white/7 rounded-2xl p-4 space-y-3">
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-semibold">At a Glance</p>
              {[
                { label: 'Total',      value: stats.total,               color: 'text-white' },
                { label: 'Liked',      value: stats.liked,               color: 'text-rose-400' },
                { label: 'Avg Rating', value: `${stats.avgRating}★`,     color: 'text-amber-400' },
                { label: 'Videos',     value: stats.video,               color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{s.label}</span>
                  <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#0d1117] border border-white/7 rounded-2xl p-4 space-y-2">
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-semibold mb-3">Actions</p>

              <button
                onClick={() => setShowAISummary(true)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 transition-all text-sm font-medium">
                <Sparkles size={14} /> AI Summary
              </button>

              <button
                onClick={() => setIsReordering(r => !r)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${isReordering
                    ? 'bg-emerald-400/15 border-emerald-400/25 text-emerald-400'
                    : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8 hover:text-white'}`}>
                <GripVertical size={14} /> {isReordering ? 'Done Reordering' : 'Reorder'}
              </button>

              <button
                onClick={() => navigate(`/testimonialwall/${spacename}`)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-gray-400 hover:bg-white/8 hover:text-white transition-all text-sm">
                <ExternalLink size={14} /> Wall of Love
              </button>

              <button
                onClick={() => navigate(`/edit/${spacename}`)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-gray-400 hover:bg-white/8 hover:text-white transition-all text-sm">
                <Edit3 size={14} /> Edit Space
              </button>
            </div>

            <div className="bg-[#0d1117] border border-white/7 rounded-2xl p-4 space-y-2">
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-semibold">Share with Customers</p>
              <p className="text-gray-500 text-xs leading-relaxed break-all">{shareableUrl.replace('http://', '')}</p>
              <button
                onClick={copyShareUrl}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-white/4 border border-white/8 hover:bg-white/8 text-gray-400 hover:text-white rounded-xl text-xs transition-all">
                {copied ? <><Check size={12} className="text-cyan-400" /> Copied!</> : <><Copy size={12} /> Copy Link</>}
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Filter Tabs + Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterTabs.map(tab => (
                <button key={tab.id} onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border
                    ${filter === tab.id
                      ? 'bg-cyan-400/15 border-cyan-400/30 text-cyan-400'
                      : 'bg-[#0d1117] border-white/7 text-gray-500 hover:bg-white/4 hover:text-white'}`}>
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full
                    ${filter === tab.id ? 'bg-cyan-400/20' : 'bg-white/6'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 bg-[#0d1117] border border-white/8 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-600" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none w-36"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={13} className="text-gray-600 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Empty state */}
          {display.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-[#0d1117] border border-white/7 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={26} className="text-gray-700" />
              </div>
              <p className="text-gray-400 font-medium mb-1">No testimonials yet</p>
              <p className="text-gray-700 text-sm">Share your space URL with customers to start collecting</p>
              <button onClick={copyShareUrl}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 rounded-xl text-sm transition-all hover:bg-cyan-400/20">
                <Copy size={13} /> Copy shareable link
              </button>
            </div>
          )}

          {/* Testimonials Grid with DnD */}
          {display.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="testimonials">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-1 xl:grid-cols-2 gap-4"
                  >
                    {display.map((t, i) => (
                      <Draggable
                        key={t.id}
                        draggableId={String(t.id)}
                        index={i}
                        isDragDisabled={!isReordering}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-80 rotate-1' : ''}
                          >
                            <TestimonialCard
                              testimonial={t}
                              onLike={handleLike}
                              isReordering={isReordering}
                            />
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