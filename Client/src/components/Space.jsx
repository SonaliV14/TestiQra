import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast, { Toaster } from 'react-hot-toast';
import {
  Sparkles, X, Search,
  Star,
  Heart, BarChart2,
  MessageSquare, Copy, Check,
  RefreshCw, GripVertical, Edit3,
  ExternalLink,
  ChevronDown, Zap, ArrowRight, Send, Mail,
  Wand2, Trophy, AlertTriangle, SlidersHorizontal
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
    if (!testimonials.length) { toast.error('No testimonials to summarise'); return; }
    setLoading(true);
    setSummary(null);
    try {
      const excerpts = testimonials.slice(0, 40).map((t, i) =>
        `[${i + 1}] Rating: ${t.Rating}/5 — "${t.Content}"`
      ).join('\n');

      const response = await fetch(`${BACKEND_URL}/api/v1/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          prompt: `You are a business analyst. Analyse these customer testimonials and return ONLY valid JSON with this exact structure:
{
  "overallSentiment": "Positive",
  "sentimentScore": 85,
  "keyPositives": ["point one", "point two", "point three"],
  "keyComplaints": ["complaint one", "complaint two"],
  "summary": "2-3 sentence executive summary here."
}

Testimonials:
${excerpts}`
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || `Backend error: ${response.status}`);
      }

      const data = await response.json();
      const raw = data.result || '{}';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setSummary({
        overallSentiment: parsed.overallSentiment || 'Mixed',
        sentimentScore:   typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 50,
        summary:          parsed.summary || 'No summary available.',
        keyPositives:     Array.isArray(parsed.keyPositives)  ? parsed.keyPositives  : [],
        keyComplaints:    Array.isArray(parsed.keyComplaints) ? parsed.keyComplaints : [],
      });
    } catch (e) {
      console.error('AI Summary error:', e);
      toast.error(e.message || 'Failed to generate summary');
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

  const sentimentColor = { Positive: 'text-emerald-400', Mixed: 'text-amber-400', Negative: 'text-red-400' };
  const sentimentBg    = { Positive: 'bg-emerald-400/10 border-emerald-400/20', Mixed: 'bg-amber-400/10 border-amber-400/20', Negative: 'bg-red-400/10 border-red-400/20' };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
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

        <div className="p-6 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <p className="text-gray-500 text-sm">Analysing testimonials with AI…</p>
            </div>
          )}

          {!loading && summary && (
            <>
              <div className={`flex items-center gap-4 p-4 rounded-xl border ${sentimentBg[summary.overallSentiment] || 'bg-white/4 border-white/8'}`}>
                <div className="flex-1">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Overall Sentiment</p>
                  <p className={`text-2xl font-bold ${sentimentColor[summary.overallSentiment] || 'text-white'}`}>{summary.overallSentiment}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Score</p>
                  <p className="text-3xl font-bold text-white">{summary.sentimentScore}<span className="text-gray-600 text-lg">/100</span></p>
                </div>
                <div className="w-20 hidden sm:block">
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full transition-all duration-700" style={{ width: `${summary.sentimentScore}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <BarChart2 size={11} /> Executive Summary
                </p>
                <p className="text-gray-200 text-sm leading-relaxed">{summary.summary}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-400/5 border border-emerald-400/15 rounded-xl">
                  <p className="text-emerald-400 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    Key Positives
                  </p>
                  {summary.keyPositives.length === 0
                    ? <p className="text-gray-600 text-xs">None identified</p>
                    : <ul className="space-y-2">{summary.keyPositives.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-emerald-400 mt-0.5 shrink-0">✓</span> {p}
                        </li>
                      ))}</ul>
                  }
                </div>
                <div className="p-4 bg-red-400/5 border border-red-400/15 rounded-xl">
                  <p className="text-red-400 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    Key Complaints
                  </p>
                  {summary.keyComplaints.length === 0
                    ? <p className="text-gray-600 text-xs">None identified</p>
                    : <ul className="space-y-2">{summary.keyComplaints.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-red-400 mt-0.5 shrink-0">✗</span> {c}
                        </li>
                      ))}</ul>
                  }
                </div>
              </div>

              <button onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl transition-all font-semibold text-sm">
                {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Summary</>}
              </button>
            </>
          )}

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

// ─── AI Improvement Coach Modal ───────────────────────────────────────────────
const AIImprovementModal = ({ testimonials, onClose }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    const lowRated = testimonials.filter(t => t.Rating <= 3 && t.Content);
    if (!lowRated.length) {
      setInsights({ issues: [], message: 'All your testimonials are 4★ or above. Keep it up!' });
      return;
    }
    setLoading(true); setInsights(null);
    try {
      const excerpts = lowRated.map((t, i) =>
        `[${i + 1}] Rating:${t.Rating}/5 — "${t.Content?.slice(0, 250)}"`
      ).join('\n');

      const res = await fetch(`${BACKEND_URL}/api/v1/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({
          prompt: `You are a product coach. Analyse these low-rated customer reviews and extract actionable improvement areas.

Return ONLY valid JSON:
{
  "issues": [
    {
      "theme": "short theme name",
      "priority": "High",
      "description": "what customers are complaining about",
      "action": "one concrete action the business can take"
    }
  ],
  "topPriority": "the single most important thing to fix right now"
}

Reviews:
${excerpts}`
        })
      });
      const data = await res.json();
      const cleaned = (data.result || '{}').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setInsights({
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        topPriority: parsed.topPriority || '',
        message: null
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate insights');
    } finally { setLoading(false); }
  };

  useEffect(() => { generate(); }, []);

  const priorityColor = {
    High:   { bg: 'bg-red-400/10 border-red-400/20',    text: 'text-red-400',   badge: 'bg-red-400/15 text-red-400' },
    Medium: { bg: 'bg-amber-400/10 border-amber-400/20', text: 'text-amber-400', badge: 'bg-amber-400/15 text-amber-400' },
    Low:    { bg: 'bg-gray-400/10 border-gray-400/20',   text: 'text-gray-400',  badge: 'bg-gray-400/15 text-gray-400' },
  };

  const copyInsights = () => {
    if (!insights?.issues) return;
    const text = [
      insights.topPriority ? `Top Priority: ${insights.topPriority}\n` : '',
      ...insights.issues.map(iss =>
        `[${iss.priority}] ${iss.theme}\nIssue: ${iss.description}\nAction: ${iss.action}`
      )
    ].join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center">
              <Zap size={17} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">AI Improvement Coach</h2>
              <p className="text-gray-500 text-xs">
                Analysing {testimonials.filter(t => t.Rating <= 3).length} low-rated reviews
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generate} disabled={loading}
              className="p-2 rounded-xl bg-white/4 hover:bg-white/8 text-gray-500 hover:text-white transition-all disabled:opacity-40">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose}
              className="p-2 rounded-xl bg-white/4 hover:bg-white/8 text-gray-500 hover:text-white transition-all">
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
                <div className="flex items-center gap-3 p-4 bg-emerald-400/8 border border-emerald-400/20 rounded-xl">
                  <Check size={18} className="text-emerald-400 shrink-0" />
                  <p className="text-emerald-300 text-sm">{insights.message}</p>
                </div>
              )}
              {insights.topPriority && (
                <div className="p-4 bg-amber-400/8 border border-amber-400/20 rounded-xl">
                  <p className="text-amber-400 text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Zap size={11} /> Top priority right now
                  </p>
                  <p className="text-white text-sm font-medium">{insights.topPriority}</p>
                </div>
              )}
              {insights.issues.length > 0 && (
                <div className="space-y-3">
                  {insights.issues.map((iss, i) => {
                    const colors = priorityColor[iss.priority] || priorityColor.Low;
                    return (
                      <div key={i} className={`p-4 border rounded-xl ${colors.bg}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-sm font-medium ${colors.text}`}>{iss.theme}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                            {iss.priority}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed mb-2">{iss.description}</p>
                        <div className="flex items-start gap-1.5 p-2 bg-white/4 border border-white/6 rounded-lg">
                          <ArrowRight size={11} className="text-gray-500 mt-0.5 shrink-0" />
                          <p className="text-gray-300 text-xs">{iss.action}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {insights.issues.length > 0 && (
                <button onClick={copyInsights}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-400 hover:bg-amber-300 text-black rounded-xl font-semibold text-sm transition-all">
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Action Plan</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── AI Testimonial Picker Modal ──────────────────────────────────────────────
const AIPickerModal = ({ testimonials, onClose, onBulkLike }) => {
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState('best'); // 'best' | 'worst'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [loved, setLoved] = useState(new Set());
  const [bulkApplied, setBulkApplied] = useState(false);

  const COUNT_OPTIONS = [3, 5, 10, 15, 20];

  const handleGenerate = async () => {
    if (!testimonials.length) {
      toast.error('No testimonials to analyse yet.');
      return;
    }
    setLoading(true);
    setResults(null);
    setLoved(new Set());
    setBulkApplied(false);

    try {
      const textTestimonials = testimonials.filter(t => t.isTextContent && t.Content);
      const pool = textTestimonials.length ? textTestimonials : testimonials;

      const excerpts = pool.map((t, i) =>
        `[index:${i}] id:${t.id} | Rating:${t.Rating}/5 | Author:${t.username} | "${t.Content?.slice(0, 300) || 'No text content'}"`
      ).join('\n');

      const actualCount = Math.min(count, pool.length);

      const res = await fetch(`${BACKEND_URL}/api/v1/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({
          prompt: `You are a testimonial curator. From these testimonials, select the ${actualCount} ${
            mode === 'best'
              ? 'BEST ones (most positive, specific, results-driven, emotionally compelling, high star ratings)'
              : 'WORST ones (most negative, vague, critical, or low-rated)'
          }.

Return ONLY valid JSON with no markdown or backticks:
{
  "picks": [
    { "index": <integer index from the list>, "id": <testimonial id>, "reason": "one sentence why" }
  ],
  "reasoning": "1-2 sentences explaining your overall selection strategy"
}

Testimonials:
${excerpts}`
        })
      });

      const data = await res.json();
      const cleaned = (data.result || '{}').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const picks = (parsed.picks || [])
        .map(p => {
          const byIndex = pool[p.index];
          const byId    = pool.find(t => String(t.id) === String(p.id));
          const testi   = byIndex || byId;
          return testi ? { ...testi, _reason: p.reason } : null;
        })
        .filter(Boolean)
        .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);

      setResults({ picks, reasoning: parsed.reasoning || '' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to pick testimonials. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle love for a single testimonial ──────────────────────────────────
  const toggleLove = (id) => {
    setLoved(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  // ── Love all picks at once ────────────────────────────────────────────────
  const loveAll = () => {
    if (!results) return;
    setLoved(new Set(results.picks.map(t => t.id)));
  };

  // ── Apply loved picks to backend ──────────────────────────────────────────
  const handleBulkLove = async () => {
    if (!results) return;
    const toApprove = results.picks.filter(t => loved.has(t.id));
    if (toApprove.length === 0) {
      toast.error('Heart at least one testimonial first.');
      return;
    }
    try {
      await onBulkLike(toApprove.map(t => t.id));
      setBulkApplied(true);
      toast.success(`${toApprove.length} testimonials loved!`);
    } catch {
      toast.error('Some updates failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Wand2 size={17} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">AI Testimonial Picker</h2>
              <p className="text-gray-500 text-xs">
                Let AI surface the {mode === 'best' ? 'best' : 'worst'} from {testimonials.length} testimonials
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {results && (
              <button onClick={handleGenerate} disabled={loading}
                className="p-2 rounded-xl bg-white/4 hover:bg-white/8 text-gray-500 hover:text-white transition-all disabled:opacity-40"
                title="Regenerate">
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
            <button onClick={onClose}
              className="p-2 rounded-xl bg-white/4 hover:bg-white/8 text-gray-500 hover:text-white transition-all">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Controls ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Count */}
            <div>
              <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-2 flex items-center gap-1">
                <SlidersHorizontal size={10} /> Number to pick
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COUNT_OPTIONS.map(n => (
                  <button key={n} type="button" onClick={() => setCount(n)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all border ${count === n
                      ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                      : 'bg-white/4 border-white/8 text-gray-500 hover:border-gray-600 hover:text-white'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-2">Pick mode</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMode('best')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${mode === 'best'
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                    : 'bg-white/4 border-white/8 text-gray-500 hover:text-white'}`}>
                  <Trophy size={12} /> Best
                </button>
                <button type="button" onClick={() => setMode('worst')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${mode === 'worst'
                    ? 'bg-red-500/15 border-red-500/35 text-red-400'
                    : 'bg-white/4 border-white/8 text-gray-500 hover:text-white'}`}>
                  <AlertTriangle size={12} /> Worst
                </button>
              </div>
            </div>
          </div>

          {/* ── Generate button ── */}
          <button onClick={handleGenerate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-violet-500/20">
            {loading
              ? <><RefreshCw size={14} className="animate-spin" /> AI is picking {Math.min(count, testimonials.length)} {mode} testimonials…</>
              : <><Wand2 size={14} /> Pick {count} {mode === 'best' ? '🏆 Best' : '⚠️ Worst'} Testimonials</>}
          </button>

          {/* ── Results ── */}
          {results && !loading && (
            <div className="space-y-3">
              {/* AI reasoning banner */}
              {results.reasoning && (
                <div className="flex items-start gap-2.5 p-3 bg-violet-500/6 border border-violet-500/15 rounded-xl">
                  <Sparkles size={12} className="text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-gray-400 text-xs leading-relaxed">{results.reasoning}</p>
                </div>
              )}

              {/* Summary counts */}
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="text-gray-600">
                  {results.picks.length} testimonial{results.picks.length !== 1 ? 's' : ''} picked
                </span>
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <Heart size={11} fill="currentColor" /> {loved.size} loved
                </span>
              </div>

              {/* Cards */}
              {results.picks.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">No matches found. Try a different count or mode.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
                  {results.picks.map((t, idx) => {
                    const isLoved = loved.has(t.id);
                    return (
                      <div key={t.id}
                        className={`relative p-4 rounded-xl border transition-all ${
                          isLoved
                            ? 'bg-rose-500/5 border-rose-500/25'
                            : 'bg-white/2 border-white/7 hover:border-white/12'
                        }`}>
                        {/* Rank badge */}
                        <span className="absolute top-3.5 left-4 w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>

                        <div className="pl-7">
                          {/* Author row */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={t.UserImageURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(t.username)}&backgroundColor=0d1117&textColor=8b5cf6`}
                                alt=""
                                className="w-6 h-6 rounded-lg object-cover border border-white/10"
                              />
                              <span className="text-white text-sm font-medium">{t.username}</span>
                              <StarRating value={t.Rating} />
                            </div>
                            {/* Heart / Love button */}
                            <button
                              type="button"
                              onClick={() => toggleLove(t.id)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${
                                isLoved
                                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-sm shadow-rose-500/20'
                                  : 'bg-white/3 border-white/8 text-gray-600 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/8'
                              }`}
                              title={isLoved ? 'Remove love' : 'Love this testimonial'}
                            >
                              <Heart size={14} fill={isLoved ? 'currentColor' : 'none'} />
                            </button>
                          </div>

                          {/* Content */}
                          <p className="text-gray-300 text-xs leading-relaxed line-clamp-3 mb-2.5">
                            "{t.Content || 'No text content'}"
                          </p>

                          {/* AI reason */}
                          {t._reason && (
                            <div className="flex items-start gap-1.5 p-2 bg-violet-500/5 border border-violet-500/12 rounded-lg">
                              <Sparkles size={10} className="text-violet-400 mt-0.5 shrink-0" />
                              <p className="text-violet-300 text-[11px] leading-relaxed">{t._reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bulk actions */}
              {results.picks.length > 0 && (
                !bulkApplied ? (
                  <div className="flex gap-2 pt-1">
                    <button onClick={loveAll}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border border-rose-500/25 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all">
                      <Heart size={12} fill="currentColor" /> Love All
                    </button>
                    <button onClick={handleBulkLove}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-xl transition-all shadow-md shadow-rose-500/20">
                      <Heart size={12} fill="currentColor" /> Apply Love ({loved.size})
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-rose-500/6 border border-rose-500/15 rounded-xl">
                    <Heart size={14} className="text-rose-400 shrink-0" fill="currentColor" />
                    <span className="text-rose-400 text-xs font-medium">
                      Love applied — check your testimonials list! ❤️
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Idle hint */}
          {!results && !loading && (
            <p className="text-gray-700 text-xs text-center pb-1">
              Configure your options above and click "Pick Testimonials" to start.
            </p>
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
      await axios.post(`${BACKEND_URL}/api/v1/email/send-reply`, {
        to: testimonial.email,
        subject,
        body: replyText,
        fromName: 'TestiQra Team',
      }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setSent(true);
      toast.success(`Reply sent to ${testimonial.email}`);
      setTimeout(onClose, 1500);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Mail size={15} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Send Reply</h2>
              <p className="text-gray-600 text-xs">To: {testimonial.email}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-xl bg-white/4 hover:bg-white/8 text-gray-500 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/6 rounded-xl">
            <img
              src={testimonial.UserImageURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(testimonial.username)}&backgroundColor=0d1117&textColor=8b5cf6`}
              alt="" className="w-8 h-8 rounded-lg object-cover border border-white/10"
            />
            <div>
              <p className="text-white text-sm font-medium">{testimonial.username}</p>
              <p className="text-gray-600 text-xs">{testimonial.email}</p>
            </div>
            <StarRating value={testimonial.Rating} />
          </div>

          <div>
            <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1.5">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors" />
          </div>

          <div>
            <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1.5">
              Your reply <span className="text-violet-400 normal-case">(editable)</span>
            </label>
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={6}
              placeholder="Write your reply here…"
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors resize-none leading-relaxed" />
            <p className="text-gray-700 text-xs mt-1">{replyText.length} characters</p>
          </div>

          <div className="p-3 bg-white/2 border border-white/5 rounded-xl">
            <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-1.5">Original testimonial</p>
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">"{testimonial.Content}"</p>
          </div>
        </div>

        <div className="p-5 border-t border-white/8 flex gap-3">
          <button onClick={onClose}
            className="px-4 py-2.5 bg-white/4 border border-white/8 hover:bg-white/8 text-gray-400 rounded-xl text-sm transition-all">
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending || sent}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${sent
                ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                : sending
                  ? 'bg-violet-600/30 text-violet-400/50 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'}`}>
            {sent ? <><Check size={14} /> Sent!</>
              : sending ? <><RefreshCw size={14} className="animate-spin" /> Sending…</>
              : <><Send size={14} /> Send Reply</>}
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
    setReplyLoading(true);
    setShowReply(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({
          prompt: `You are a friendly business owner. Write a SHORT, warm, genuine reply to this customer testimonial. 2-3 sentences max. No hashtags. No emojis. Do not mention the rating number.

Customer: ${testimonial.username}
Rating: ${testimonial.Rating}/5
Testimonial: "${testimonial.Content}"

Return ONLY valid JSON:
{ "reply": "your reply text here" }`
        })
      });
      const data = await res.json();
      const cleaned = (data.result || '{}').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setReply(parsed.reply || 'Thank you so much for sharing your experience!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate reply');
      setShowReply(false);
    } finally { setReplyLoading(false); }
  };

  const copyReply = () => {
    if (!reply) return;
    navigator.clipboard.writeText(reply);
    setReplyCopied(true);
    setTimeout(() => setReplyCopied(false), 2000);
  };

  return (
    <div className={`group bg-[#0d1117] border rounded-2xl p-5 transition-all duration-200 hover:bg-[#111318]
      ${testimonial.liked
        ? 'border-rose-500/30 shadow-rose-500/5 shadow-lg'
        : 'border-white/7 hover:border-white/12'}`}>

      {showEmailModal && (
        <EmailReplyModal
          testimonial={testimonial}
          initialReply={reply}
          onClose={() => setShowEmailModal(false)}
        />
      )}

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

      {testimonial.isTextContent && (
        <div className="mt-3 space-y-2">
          <button onClick={generateReply} disabled={replyLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
            {replyLoading
              ? <><RefreshCw size={11} className="animate-spin" /> Drafting reply…</>
              : showReply && reply
                ? <><ChevronDown size={11} /> Hide reply</>
                : <><MessageSquare size={11} /> AI draft reply</>}
          </button>

          {showReply && (
            <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl">
              {replyLoading
                ? <div className="h-4 bg-white/5 rounded animate-pulse" />
                : (
                  <>
                    <p className="text-gray-300 text-xs leading-relaxed mb-3">{reply}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={copyReply}
                        className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors px-2.5 py-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20 hover:bg-purple-500/20">
                        {replyCopied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                      </button>
                      <button onClick={() => setShowEmailModal(true)}
                        className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-white transition-colors px-2.5 py-1.5 bg-violet-600/15 rounded-lg border border-violet-500/25 hover:bg-violet-600/25">
                        <Send size={11} /> Send to reviewer
                      </button>
                    </div>
                  </>
                )
              }
            </div>
          )}
        </div>
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
  const [showAISummary, setShowAISummary]     = useState(false);
  const [showImprovement, setShowImprovement] = useState(false);
  const [showAIPicker, setShowAIPicker]       = useState(false);
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
    axios.get(`${BACKEND_URL}/api/v1/spaceinfo`, {
      params: { spacename },
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(r => setSpaceinfo(r.data)).catch(console.error);
  }, [spacename]);

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

  useEffect(() => {
    let list = [...testimonials];
    if (filter === 'liked') list = list.filter(t => t.liked);
    if (filter === 'video') list = list.filter(t => !t.isTextContent);
    if (filter === 'text')  list = list.filter(t => t.isTextContent);
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
    await axios.post(`${BACKEND_URL}/api/v1/liked`,
      { testimonialid: id, isLiked: !isLiked },
      { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }
    );
  };

  // ── Bulk like handler for AI Picker ────────────────────────────────────────
  const handleBulkLike = async (ids) => {
    setTestimonials(prev =>
      prev.map(t => ids.includes(t.id) ? { ...t, liked: true } : t)
    );
    await Promise.all(
      ids.map(id =>
        axios.post(`${BACKEND_URL}/api/v1/liked`,
          { testimonialid: id, isLiked: true },
          { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }
        ).catch(() => null)
      )
    );
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
    { id: 'all',   label: 'All',      count: stats.total },
    { id: 'liked', label: '❤️ Loved', count: stats.liked },
    { id: 'text',  label: '📝 Text',  count: stats.total - stats.video },
    { id: 'video', label: '📹 Video', count: stats.video },
  ];

  return (
    <div className="min-h-screen w-full bg-[#080a0f] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');`}</style>

      <Toaster position="top-right" toastOptions={{
        style: { background: '#111318', color: '#fff', border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px' }
      }} />

      {/* ── Modals ── */}
      {showAISummary   && <AISummaryModal     testimonials={testimonials} onClose={() => setShowAISummary(false)} />}
      {showImprovement && <AIImprovementModal testimonials={testimonials} onClose={() => setShowImprovement(false)} />}
      {showAIPicker    && (
        <AIPickerModal
          testimonials={testimonials}
          onClose={() => setShowAIPicker(false)}
          onBulkLike={handleBulkLike}
        />
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
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
                className="text-white text-base leading-tight">{spaceinfo.spaceinfo?.space_name || spacename}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={copyShareUrl}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/4 border border-white/8 hover:bg-white/8 text-gray-400 hover:text-white rounded-xl transition-all text-xs font-medium"
              title={shareableUrl}>
              <ExternalLink size={13} className="shrink-0" />
              <span className="truncate max-w-[180px]">{shareableUrl.replace('http://', '')}</span>
              {copied ? <Check size={12} className="text-cyan-400 shrink-0" /> : <Copy size={12} className="shrink-0" />}
            </button>
            <button onClick={() => setShowAIPicker(true)}
              className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 text-violet-400 rounded-xl transition-all text-sm font-medium">
              <Wand2 size={14} /> AI Picker
            </button>
            <button onClick={() => setShowAISummary(true)}
              className="flex items-center gap-2 px-3 py-2 bg-cyan-400/10 border border-cyan-400/20 hover:bg-cyan-400/20 text-cyan-400 rounded-xl transition-all text-sm font-medium">
              <Sparkles size={14} /> AI Summary
            </button>
            <button onClick={() => navigate(`/edit/${spacename}`)}
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
                { label: 'Total',      value: stats.total,           color: 'text-white' },
                { label: 'Loved',      value: stats.liked,           color: 'text-rose-400' },
                { label: 'Avg Rating', value: `${stats.avgRating}★`, color: 'text-amber-400' },
                { label: 'Videos',     value: stats.video,           color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{s.label}</span>
                  <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#0d1117] border border-white/7 rounded-2xl p-4 space-y-2">
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-semibold mb-3">Actions</p>

              <button onClick={() => setShowAISummary(true)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 transition-all text-sm font-medium">
                <Sparkles size={14} /> AI Summary
              </button>

              <button onClick={() => setShowImprovement(true)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 hover:bg-amber-400/20 transition-all text-sm font-medium">
                <Zap size={14} /> Improvement Coach
              </button>

              <button onClick={() => setShowAIPicker(true)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all text-sm font-medium">
                <Wand2 size={14} /> AI Picker
                <span className="ml-auto text-[9px] font-bold bg-violet-500/25 text-violet-300 px-1.5 py-0.5 rounded-full">NEW</span>
              </button>

              <button onClick={() => setIsReordering(r => !r)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${isReordering
                    ? 'bg-emerald-400/15 border-emerald-400/25 text-emerald-400'
                    : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8 hover:text-white'}`}>
                <GripVertical size={14} /> {isReordering ? 'Done Reordering' : 'Reorder'}
              </button>

              <button onClick={() => navigate(`/testimonialwall/${spacename}`)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-gray-400 hover:bg-white/8 hover:text-white transition-all text-sm">
                <ExternalLink size={14} /> Wall of Love
              </button>

              <button onClick={() => navigate(`/edit/${spacename}`)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-gray-400 hover:bg-white/8 hover:text-white transition-all text-sm">
                <Edit3 size={14} /> Edit Space
              </button>
            </div>

            <div className="bg-[#0d1117] border border-white/7 rounded-2xl p-4 space-y-2">
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-semibold">Share with Customers</p>
              <p className="text-gray-500 text-xs leading-relaxed break-all">{shareableUrl.replace('http://', '')}</p>
              <button onClick={copyShareUrl}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-white/4 border border-white/8 hover:bg-white/8 text-gray-400 hover:text-white rounded-xl text-xs transition-all">
                {copied ? <><Check size={12} className="text-cyan-400" /> Copied!</> : <><Copy size={12} /> Copy Link</>}
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterTabs.map(tab => (
                <button key={tab.id} onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border
                    ${filter === tab.id
                      ? 'bg-cyan-400/15 border-cyan-400/30 text-cyan-400'
                      : 'bg-[#0d1117] border-white/7 text-gray-500 hover:bg-white/4 hover:text-white'}`}>
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.id ? 'bg-cyan-400/20' : 'bg-white/6'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 bg-[#0d1117] border border-white/8 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-600" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none w-36" />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={13} className="text-gray-600 hover:text-white" />
                </button>
              )}
            </div>
          </div>

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

          {display.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="testimonials">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}
                    className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
    </div>
  );
}