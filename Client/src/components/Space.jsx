import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast, { Toaster } from 'react-hot-toast';
import {
  Sparkles, X, Search, Star, Heart, BarChart2, MessageSquare,
  Copy, Check, RefreshCw, GripVertical, Edit3, ExternalLink,
  ChevronDown, Zap, ArrowRight, Send, Mail, Wand2, Trophy,
  AlertTriangle, SlidersHorizontal
} from 'lucide-react';

const BACKEND_URL = "http://localhost:3001";
const FRONTEND_URL = "http://localhost:5173";

// ─── Star Rating ─────────────────────────────────────────────────────────────
const StarRating = ({ value }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} size={13}
        className={s <= value ? 'text-amber-400' : 'text-gray-700'}
        fill={s <= value ? 'currentColor' : 'none'} />
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
    if (!testimonials.length) { toast.error('No testimonials to summarise'); return; }
    setLoading(true); setSummary(null);
    try {
      const excerpts = testimonials.slice(0, 40).map((t, i) => `[${i+1}] Rating: ${t.Rating}/5 — "${t.Content}"`).join('\n');
      const response = await fetch(`${BACKEND_URL}/api/v1/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ prompt: `You are a business analyst. Analyse these customer testimonials and return ONLY valid JSON:\n{"overallSentiment":"Positive","sentimentScore":85,"keyPositives":["point one"],"keyComplaints":["complaint one"],"summary":"2-3 sentence executive summary."}\n\nTestimonials:\n${excerpts}` })
      });
      const data = await response.json();
      const parsed = JSON.parse((data.result || '{}').replace(/```json|```/g, '').trim());
      setSummary({
        overallSentiment: parsed.overallSentiment || 'Mixed',
        sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 50,
        summary: parsed.summary || 'No summary available.',
        keyPositives: Array.isArray(parsed.keyPositives) ? parsed.keyPositives : [],
        keyComplaints: Array.isArray(parsed.keyComplaints) ? parsed.keyComplaints : [],
      });
    } catch (e) { toast.error('Failed to generate summary'); }
    finally { setLoading(false); }
  };

  useEffect(() => { generateSummary(); }, []);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText([
      `Overall Sentiment: ${summary.overallSentiment} (${summary.sentimentScore}/100)`,
      `\nSummary: ${summary.summary}`,
      `\nKey Positives:\n${summary.keyPositives.map(p => `• ${p}`).join('\n')}`,
      `\nKey Complaints:\n${summary.keyComplaints.map(c => `• ${c}`).join('\n')}`,
    ].join(''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sentimentColor = { Positive: 'text-emerald-400', Mixed: 'text-amber-400', Negative: 'text-red-400' };
  const sentimentBg = { Positive: 'bg-emerald-500/10 border-emerald-500/20', Mixed: 'bg-amber-500/10 border-amber-500/20', Negative: 'bg-red-500/10 border-red-500/20' };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Sparkles size={17} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">AI Testimonial Summary</h2>
              <p className="text-gray-500 text-xs">{testimonials.length} testimonials analysed</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generateSummary} disabled={loading}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all disabled:opacity-40">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
              <p className="text-gray-500 text-sm">Analysing testimonials with AI…</p>
            </div>
          )}
          {!loading && summary && (
            <>
              <div className={`flex items-center gap-4 p-4 rounded-xl border ${sentimentBg[summary.overallSentiment] || 'bg-gray-800/50 border-gray-700'}`}>
                <div className="flex-1">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Overall Sentiment</p>
                  <p className={`text-2xl font-black ${sentimentColor[summary.overallSentiment] || 'text-white'}`}>{summary.overallSentiment}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Score</p>
                  <p className="text-3xl font-black text-white">{summary.sentimentScore}<span className="text-gray-600 text-lg">/100</span></p>
                </div>
                <div className="w-20 hidden sm:block">
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${summary.sentimentScore}%` }} />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5"><BarChart2 size={11} /> Executive Summary</p>
                <p className="text-gray-200 text-sm leading-relaxed">{summary.summary}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-500/8 border border-emerald-500/15 rounded-xl">
                  <p className="text-emerald-400 text-xs uppercase tracking-widest mb-3">Key Positives</p>
                  {summary.keyPositives.length === 0
                    ? <p className="text-gray-600 text-xs">None identified</p>
                    : <ul className="space-y-2">{summary.keyPositives.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-emerald-400 mt-0.5 shrink-0">✓</span> {p}
                        </li>
                      ))}</ul>}
                </div>
                <div className="p-4 bg-red-500/8 border border-red-500/15 rounded-xl">
                  <p className="text-red-400 text-xs uppercase tracking-widest mb-3">Key Complaints</p>
                  {summary.keyComplaints.length === 0
                    ? <p className="text-gray-600 text-xs">None identified</p>
                    : <ul className="space-y-2">{summary.keyComplaints.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-red-400 mt-0.5 shrink-0">✗</span> {c}
                        </li>
                      ))}</ul>}
                </div>
              </div>
              <button onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-violet-500/20">
                {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Summary</>}
              </button>
            </>
          )}
          {!loading && !summary && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No summary generated yet.</p>
              <button onClick={generateSummary} className="mt-3 px-4 py-2 bg-violet-600/15 border border-violet-500/30 text-violet-400 rounded-xl text-sm hover:bg-violet-600/25 transition-all">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── AI Improvement Modal ─────────────────────────────────────────────────────
const AIImprovementModal = ({ testimonials, onClose }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    const lowRated = testimonials.filter(t => t.Rating <= 3 && t.Content);
    if (!lowRated.length) { setInsights({ issues: [], message: 'All your testimonials are 4★ or above. Keep it up!' }); return; }
    setLoading(true); setInsights(null);
    try {
      const excerpts = lowRated.map((t, i) => `[${i+1}] Rating:${t.Rating}/5 — "${t.Content?.slice(0,250)}"`).join('\n');
      const res = await fetch(`${BACKEND_URL}/api/v1/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ prompt: `You are a product coach. Analyse these low-rated reviews. Return ONLY valid JSON:\n{"issues":[{"theme":"short name","priority":"High","description":"what customers complain","action":"concrete action"}],"topPriority":"most important fix"}\n\nReviews:\n${excerpts}` })
      });
      const data = await res.json();
      const parsed = JSON.parse((data.result || '{}').replace(/```json|```/g, '').trim());
      setInsights({ issues: Array.isArray(parsed.issues) ? parsed.issues : [], topPriority: parsed.topPriority || '', message: null });
    } catch (e) { toast.error('Failed to generate insights'); }
    finally { setLoading(false); }
  };

  useEffect(() => { generate(); }, []);

  const priorityColor = {
    High:   { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', badge: 'bg-red-500/15 text-red-400' },
    Medium: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-400' },
    Low:    { bg: 'bg-gray-800/50 border-gray-700', text: 'text-gray-400', badge: 'bg-gray-700 text-gray-400' },
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Zap size={17} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">AI Improvement Coach</h2>
              <p className="text-gray-500 text-xs">Analysing {testimonials.filter(t => t.Rating <= 3).length} low-rated reviews</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generate} disabled={loading}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all disabled:opacity-40">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <p className="text-gray-500 text-sm">Analysing low-rated feedback…</p>
            </div>
          )}
          {!loading && insights && (
            <>
              {insights.message && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
                  <Check size={18} className="text-emerald-400 shrink-0" />
                  <p className="text-emerald-300 text-sm">{insights.message}</p>
                </div>
              )}
              {insights.topPriority && (
                <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                  <p className="text-amber-400 text-xs uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Zap size={11} /> Top priority right now</p>
                  <p className="text-white text-sm font-semibold">{insights.topPriority}</p>
                </div>
              )}
              {insights.issues.map((iss, i) => {
                const colors = priorityColor[iss.priority] || priorityColor.Low;
                return (
                  <div key={i} className={`p-4 border rounded-xl ${colors.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-semibold ${colors.text}`}>{iss.theme}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>{iss.priority}</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed mb-2">{iss.description}</p>
                    <div className="flex items-start gap-1.5 p-2 bg-gray-800/60 border border-gray-700/50 rounded-lg">
                      <ArrowRight size={11} className="text-gray-500 mt-0.5 shrink-0" />
                      <p className="text-gray-300 text-xs">{iss.action}</p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── AI Picker Modal ──────────────────────────────────────────────────────────
const AIPickerModal = ({ testimonials, onClose, onBulkLike }) => {
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState('best');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [loved, setLoved] = useState(new Set());
  const [bulkApplied, setBulkApplied] = useState(false);
  const COUNT_OPTIONS = [3, 5, 10, 15, 20];

  const handleGenerate = async () => {
    if (!testimonials.length) { toast.error('No testimonials to analyse yet.'); return; }
    setLoading(true); setResults(null); setLoved(new Set()); setBulkApplied(false);
    try {
      const pool = testimonials.filter(t => t.isTextContent && t.Content).length
        ? testimonials.filter(t => t.isTextContent && t.Content) : testimonials;
      const excerpts = pool.map((t, i) => `[index:${i}] id:${t.id} | Rating:${t.Rating}/5 | Author:${t.username} | "${t.Content?.slice(0,300) || 'No text'}"`).join('\n');
      const actualCount = Math.min(count, pool.length);
      const res = await fetch(`${BACKEND_URL}/api/v1/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ prompt: `You are a testimonial curator. Select the ${actualCount} ${mode === 'best' ? 'BEST' : 'WORST'} ones. Return ONLY valid JSON:\n{"picks":[{"index":<int>,"id":<id>,"reason":"one sentence why"}],"reasoning":"1-2 sentences"}\n\nTestimonials:\n${excerpts}` })
      });
      const data = await res.json();
      const parsed = JSON.parse((data.result || '{}').replace(/```json|```/g, '').trim());
      const picks = (parsed.picks || []).map(p => {
        const t = pool[p.index] || pool.find(t => String(t.id) === String(p.id));
        return t ? { ...t, _reason: p.reason } : null;
      }).filter(Boolean).filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
      setResults({ picks, reasoning: parsed.reasoning || '' });
    } catch (e) { toast.error('Failed to pick testimonials. Try again.'); }
    finally { setLoading(false); }
  };

  const toggleLove = (id) => {
    setLoved(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const handleBulkLove = async () => {
    if (!results) return;
    const toApprove = results.picks.filter(t => loved.has(t.id));
    if (toApprove.length === 0) { toast.error('Heart at least one testimonial first.'); return; }
    try {
      await onBulkLike(toApprove.map(t => t.id));
      setBulkApplied(true);
      toast.success(`${toApprove.length} testimonials loved!`);
    } catch { toast.error('Some updates failed.'); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Wand2 size={17} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">AI Testimonial Picker</h2>
              <p className="text-gray-500 text-xs">Let AI surface the {mode === 'best' ? 'best' : 'worst'} from {testimonials.length} testimonials</p>
            </div>
          </div>
          <div className="flex gap-2">
            {results && <button onClick={handleGenerate} disabled={loading}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all disabled:opacity-40">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>}
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"><X size={15} /></button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-500 text-xs uppercase tracking-widest block mb-2 flex items-center gap-1"><SlidersHorizontal size={10} /> Number to pick</label>
              <div className="flex flex-wrap gap-1.5">
                {COUNT_OPTIONS.map(n => (
                  <button key={n} type="button" onClick={() => setCount(n)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all border ${count === n ? 'bg-violet-600/20 border-violet-500/40 text-violet-400' : 'bg-gray-800/60 border-gray-700 text-gray-500 hover:text-white'}`}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-500 text-xs uppercase tracking-widest block mb-2">Pick mode</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMode('best')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${mode === 'best' ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:text-white'}`}>
                  <Trophy size={12} /> Best
                </button>
                <button type="button" onClick={() => setMode('worst')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${mode === 'worst' ? 'bg-red-500/15 border-red-500/35 text-red-400' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:text-white'}`}>
                  <AlertTriangle size={12} /> Worst
                </button>
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-violet-500/20">
            {loading
              ? <><RefreshCw size={14} className="animate-spin" /> AI is picking {Math.min(count, testimonials.length)} testimonials…</>
              : <><Wand2 size={14} /> Pick {count} {mode === 'best' ? '🏆 Best' : '⚠️ Worst'} Testimonials</>}
          </button>

          {results && !loading && (
            <div className="space-y-3">
              {results.reasoning && (
                <div className="flex items-start gap-2.5 p-3 bg-violet-500/8 border border-violet-500/15 rounded-xl">
                  <Sparkles size={12} className="text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-gray-400 text-xs leading-relaxed">{results.reasoning}</p>
                </div>
              )}
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="text-gray-600">{results.picks.length} testimonial{results.picks.length !== 1 ? 's' : ''} picked</span>
                <span className="text-rose-400 font-medium flex items-center gap-1"><Heart size={11} fill="currentColor" /> {loved.size} loved</span>
              </div>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {results.picks.map((t, idx) => {
                  const isLoved = loved.has(t.id);
                  return (
                    <div key={t.id} className={`relative p-4 rounded-xl border transition-all ${isLoved ? 'bg-rose-500/5 border-rose-500/25' : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600'}`}>
                      <span className="absolute top-3.5 left-4 w-5 h-5 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">{idx + 1}</span>
                      <div className="pl-7">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <img src={t.UserImageURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(t.username)}&backgroundColor=1f2937&textColor=8b5cf6`}
                              alt="" className="w-6 h-6 rounded-lg object-cover border border-gray-700" />
                            <span className="text-white text-sm font-medium">{t.username}</span>
                            <StarRating value={t.Rating} />
                          </div>
                          <button type="button" onClick={() => toggleLove(t.id)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${isLoved ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-gray-800 border-gray-700 text-gray-600 hover:text-rose-400 hover:border-rose-500/30'}`}>
                            <Heart size={14} fill={isLoved ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed line-clamp-3 mb-2.5">"{t.Content || 'No text content'}"</p>
                        {t._reason && (
                          <div className="flex items-start gap-1.5 p-2 bg-violet-500/5 border border-violet-500/12 rounded-lg">
                            <Sparkles size={10} className="text-violet-400 mt-0.5 shrink-0" />
                            <p className="text-violet-300 text-xs leading-relaxed">{t._reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {results.picks.length > 0 && (!bulkApplied ? (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setLoved(new Set(results.picks.map(t => t.id)))}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border border-rose-500/25 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all">
                    <Heart size={12} fill="currentColor" /> Love All
                  </button>
                  <button onClick={handleBulkLove}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-xl transition-all shadow-md shadow-rose-500/20">
                    <Heart size={12} fill="currentColor" /> Apply Love ({loved.size})
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-rose-500/8 border border-rose-500/15 rounded-xl">
                  <Heart size={14} className="text-rose-400 shrink-0" fill="currentColor" />
                  <span className="text-rose-400 text-xs font-medium">Love applied — check your testimonials list! ❤️</span>
                </div>
              ))}
            </div>
          )}
          {!results && !loading && (
            <p className="text-gray-600 text-xs text-center pb-1">Configure your options above and click "Pick Testimonials" to start.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Email Reply Modal ────────────────────────────────────────────────────────
const EmailReplyModal = ({ testimonial, initialReply, onClose }) => {
  const [replyText, setReplyText] = useState(initialReply || '');
  const [subject, setSubject] = useState(`Thank you for your testimonial, ${testimonial.username}!`);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!replyText.trim()) { toast.error('Reply cannot be empty'); return; }
    setSending(true);
    try {
      await axios.post(`${BACKEND_URL}/api/v1/email/send-reply`,
        { to: testimonial.email, subject, body: replyText, fromName: 'TestiQra Team' },
        { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setSent(true);
      toast.success(`Reply sent to ${testimonial.email}`);
      setTimeout(onClose, 1500);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to send reply'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Mail size={15} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Send Reply</h2>
              <p className="text-gray-500 text-xs">To: {testimonial.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"><X size={15} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
            <img src={testimonial.UserImageURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(testimonial.username)}&backgroundColor=1f2937&textColor=8b5cf6`}
              alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-700" />
            <div>
              <p className="text-white text-sm font-medium">{testimonial.username}</p>
              <p className="text-gray-500 text-xs">{testimonial.email}</p>
            </div>
            <StarRating value={testimonial.Rating} />
          </div>
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-widest block mb-1.5">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
          </div>
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-widest block mb-1.5">Your reply <span className="text-violet-400 normal-case">(editable)</span></label>
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={6}
              placeholder="Write your reply here…"
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none leading-relaxed" />
          </div>
        </div>
        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="px-4 py-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-400 rounded-xl text-sm transition-all">Cancel</button>
          <button onClick={handleSend} disabled={sending || sent}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${sent ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400' : sending ? 'bg-violet-600/30 text-violet-400/50 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'}`}>
            {sent ? <><Check size={14} /> Sent!</> : sending ? <><RefreshCw size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send Reply</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Testimonial Card ─────────────────────────────────────────────────────────
const TestimonialCard = ({ testimonial, onLike, isReordering }) => {
  const isVideo = !testimonial.isTextContent;
  const [reply, setReply] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyCopied, setReplyCopied] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const generateReply = async () => {
    if (reply) { setShowReply(r => !r); return; }
    setReplyLoading(true); setShowReply(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ prompt: `Write a SHORT, warm, genuine reply to this testimonial. 2-3 sentences max. No hashtags. No emojis. Return ONLY valid JSON: {"reply":"your reply"}\n\nCustomer: ${testimonial.username}\nRating: ${testimonial.Rating}/5\nTestimonial: "${testimonial.Content}"` })
      });
      const data = await res.json();
      const parsed = JSON.parse((data.result || '{}').replace(/```json|```/g, '').trim());
      setReply(parsed.reply || 'Thank you so much for sharing your experience!');
    } catch (e) { toast.error('Failed to generate reply'); setShowReply(false); }
    finally { setReplyLoading(false); }
  };

  return (
    <div className={`group bg-gray-900/60 border rounded-2xl p-5 transition-all duration-200 hover:bg-gray-900 ${testimonial.liked ? 'border-rose-500/30 shadow-rose-500/5 shadow-lg' : 'border-gray-800 hover:border-gray-700'}`}>
      {showEmailModal && <EmailReplyModal testimonial={testimonial} initialReply={reply} onClose={() => setShowEmailModal(false)} />}

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <img src={testimonial.UserImageURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(testimonial.username)}&backgroundColor=1f2937&textColor=8b5cf6`}
            alt={testimonial.username} className="w-10 h-10 rounded-xl object-cover border border-gray-700 bg-gray-800" />
          <div>
            <p className="text-white font-semibold text-sm">{testimonial.username}</p>
            <p className="text-gray-500 text-xs">{testimonial.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${isVideo ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
            {isVideo ? '📹 Video' : '📝 Text'}
          </span>
          {isReordering && <GripVertical size={15} className="text-gray-600" />}
          <button onClick={() => onLike(testimonial.id, testimonial.liked)}
            className={`p-1.5 rounded-xl transition-all ${testimonial.liked ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-gray-800 text-gray-600 hover:bg-gray-700 hover:text-rose-400'}`}>
            <Heart size={13} fill={testimonial.liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <StarRating value={testimonial.Rating} />

      <div className="mt-3">
        {isVideo && testimonial.videoUrl
          ? <video src={testimonial.videoUrl} controls className="w-full rounded-xl mb-3 max-h-48 bg-black border border-gray-700" />
          : <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 mt-2">{testimonial.Content}</p>}
      </div>

      {testimonial.imageURL && <img src={testimonial.imageURL} alt="" className="w-full rounded-xl mt-3 max-h-48 object-cover border border-gray-700" />}

      {testimonial.isTextContent && (
        <div className="mt-3 space-y-2">
          <button onClick={generateReply} disabled={replyLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
            {replyLoading ? <><RefreshCw size={11} className="animate-spin" /> Drafting reply…</>
              : showReply && reply ? <><ChevronDown size={11} /> Hide reply</>
              : <><MessageSquare size={11} /> AI draft reply</>}
          </button>
          {showReply && (
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
              {replyLoading ? <div className="h-4 bg-gray-700/50 rounded animate-pulse" /> : (
                <>
                  <p className="text-gray-300 text-xs leading-relaxed mb-3">{reply}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => { navigator.clipboard.writeText(reply); setReplyCopied(true); setTimeout(() => setReplyCopied(false), 2000); }}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                      {replyCopied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                    </button>
                    <button onClick={() => setShowEmailModal(true)}
                      className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-white px-2.5 py-1.5 bg-violet-600/15 rounded-lg border border-violet-500/25 hover:bg-violet-600/25 transition-colors">
                      <Send size={11} /> Send to reviewer
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-gray-600 text-xs mt-3">
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
  const [showImprovement, setShowImprovement] = useState(false);
  const [showAIPicker, setShowAIPicker] = useState(false);
  const [stats, setStats] = useState({ total: 0, liked: 0, avgRating: 0, video: 0 });
  const [copied, setCopied] = useState(false);
  const shareableUrl = `${FRONTEND_URL}/testimonial.to/${spacename}`;

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/v1/spaceinfo`, { params: { spacename }, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } })
      .then(r => setSpaceinfo(r.data)).catch(console.error);
  }, [spacename]);

  const fetchTestimonials = useCallback(async () => {
    try {
      const r = await axios.get(`${BACKEND_URL}/api/v1/fetchtestimonials`, { params: { spacename }, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      const saved = JSON.parse(localStorage.getItem(`testimonial-order-${spacename}`) || '[]');
      let list = r.data.testimonials || [];
      if (saved.length) {
        const map = new Map(saved.map((id, i) => [id, i]));
        list = [...list].sort((a, b) => (map.get(a.id) ?? 999) - (map.get(b.id) ?? 999));
      }
      setTestimonials(list);
      const total = list.length, liked = list.filter(t => t.liked).length;
      const avgRating = total ? (list.reduce((s, t) => s + t.Rating, 0) / total).toFixed(1) : 0;
      const video = list.filter(t => !t.isTextContent).length;
      setStats({ total, liked, avgRating, video });
    } catch (e) { console.error(e); }
  }, [spacename]);

  useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

  useEffect(() => {
    let list = [...testimonials];
    if (filter === 'liked') list = list.filter(t => t.liked);
    if (filter === 'video') list = list.filter(t => !t.isTextContent);
    if (filter === 'text') list = list.filter(t => t.isTextContent);
    if (search) { const q = search.toLowerCase(); list = list.filter(t => t.username?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.Content?.toLowerCase().includes(q)); }
    setDisplay(list);
  }, [testimonials, filter, search]);

  const handleLike = async (id, isLiked) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, liked: !t.liked } : t));
    await axios.post(`${BACKEND_URL}/api/v1/liked`, { testimonialid: id, isLiked: !isLiked }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
  };

  const handleBulkLike = async (ids) => {
    setTestimonials(prev => prev.map(t => ids.includes(t.id) ? { ...t, liked: true } : t));
    await Promise.all(ids.map(id => axios.post(`${BACKEND_URL}/api/v1/liked`, { testimonialid: id, isLiked: true }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).catch(() => null)));
    fetchTestimonials();
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
    <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/6 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <Toaster position="top-right" toastOptions={{ style: { background: '#111827', color: '#fff', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px' } }} />

      {showAISummary && <AISummaryModal testimonials={testimonials} onClose={() => setShowAISummary(false)} />}
      {showImprovement && <AIImprovementModal testimonials={testimonials} onClose={() => setShowImprovement(false)} />}
      {showAIPicker && <AIPickerModal testimonials={testimonials} onClose={() => setShowAIPicker(false)} onBulkLike={handleBulkLike} />}

      {/* Navbar */}
      <nav className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span className="font-bold text-lg">TestiQra</span>
            </div>
            <div className="w-px h-5 bg-gray-700" />
            <div className="flex items-center gap-3">
              <img src={spaceinfo.spaceinfo?.logo || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'}
                alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-700 bg-gray-800" />
              <h1 className="text-white font-bold text-base leading-tight">{spaceinfo.spaceinfo?.space_name || spacename}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyShareUrl}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all text-xs font-medium">
              <ExternalLink size={13} className="shrink-0" />
              <span className="truncate max-w-[180px]">{shareableUrl.replace('http://', '')}</span>
              {copied ? <Check size={12} className="text-violet-400 shrink-0" /> : <Copy size={12} className="shrink-0" />}
            </button>
            <button onClick={() => setShowAIPicker(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all text-sm font-medium">
              <Wand2 size={14} /> AI Picker
            </button>
            <button onClick={() => setShowAISummary(true)}
              className="flex items-center gap-2 px-3 py-2 bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/20 text-violet-400 rounded-xl transition-all text-sm font-medium">
              <Sparkles size={14} /> AI Summary
            </button>
            <button onClick={() => navigate(`/edit/${spacename}`)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all text-sm">
              <Edit3 size={14} /> Edit
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8 relative">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-3">
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">At a Glance</p>
              {[
                { label: 'Total', value: stats.total, color: 'text-white' },
                { label: 'Loved', value: stats.liked, color: 'text-rose-400' },
                { label: 'Avg Rating', value: `${stats.avgRating}★`, color: 'text-amber-400' },
                { label: 'Videos', value: stats.video, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{s.label}</span>
                  <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-2">
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">Actions</p>
              {[
                { label: 'AI Summary', icon: <Sparkles size={14} />, color: 'text-violet-400 bg-violet-600/10 border-violet-500/20 hover:bg-violet-600/20', onClick: () => setShowAISummary(true) },
                { label: 'Improvement Coach', icon: <Zap size={14} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20', onClick: () => setShowImprovement(true) },
                { label: 'AI Picker', icon: <Wand2 size={14} />, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20', onClick: () => setShowAIPicker(true), badge: 'NEW' },
                { label: isReordering ? 'Done Reordering' : 'Reorder', icon: <GripVertical size={14} />, color: isReordering ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25' : 'text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700', onClick: () => setIsReordering(r => !r) },
                { label: 'Wall of Love', icon: <ExternalLink size={14} />, color: 'text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700', onClick: () => navigate(`/testimonialwall/${spacename}`) },
                { label: 'Edit Space', icon: <Edit3 size={14} />, color: 'text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700', onClick: () => navigate(`/edit/${spacename}`) },
              ].map(({ label, icon, color, onClick, badge }) => (
                <button key={label} onClick={onClick}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${color}`}>
                  {icon} {label}
                  {badge && <span className="ml-auto text-xs font-bold bg-violet-500/25 text-violet-300 px-1.5 py-0.5 rounded-full">{badge}</span>}
                </button>
              ))}
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-2">
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">Share with Customers</p>
              <p className="text-gray-500 text-xs leading-relaxed break-all">{shareableUrl.replace('http://', '')}</p>
              <button onClick={copyShareUrl}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-xs transition-all">
                {copied ? <><Check size={12} className="text-violet-400" /> Copied!</> : <><Copy size={12} /> Copy Link</>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterTabs.map(tab => (
                <button key={tab.id} onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${filter === tab.id ? 'bg-violet-600/15 border-violet-500/30 text-violet-400' : 'bg-gray-900/60 border-gray-800 text-gray-500 hover:bg-gray-900 hover:text-white'}`}>
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.id ? 'bg-violet-500/20' : 'bg-gray-800'}`}>{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-600" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none w-36" />
              {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-600 hover:text-white" /></button>}
            </div>
          </div>

          {display.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={26} className="text-gray-700" />
              </div>
              <p className="text-gray-400 font-semibold mb-1">No testimonials yet</p>
              <p className="text-gray-600 text-sm">Share your space URL with customers to start collecting</p>
              <button onClick={copyShareUrl}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600/15 border border-violet-500/30 text-violet-400 rounded-xl text-sm transition-all hover:bg-violet-600/25">
                <Copy size={13} /> Copy shareable link
              </button>
            </div>
          )}

          {display.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="testimonials">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {display.map((t, i) => (
                      <Draggable key={t.id} draggableId={String(t.id)} index={i} isDragDisabled={!isReordering}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-80 rotate-1' : ''}>
                            <TestimonialCard testimonial={t} onLike={handleLike} isReordering={isReordering} />
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

      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-600 text-sm mt-8">
        <p>© 2024 TestiQra.</p>
      </footer>
    </div>
  );
}