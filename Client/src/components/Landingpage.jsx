import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Zap, Shield, BarChart2, MessageSquare, Video, Sparkles, Code2, Eye, Copy, Check } from 'lucide-react';

const FEATURES = [
  {
    icon: <MessageSquare size={22} />,
    title: 'Text & Video Reviews',
    desc: 'Collect both written and video testimonials from your customers with a beautiful submission page.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: <Sparkles size={22} />,
    title: 'AI-Powered Insights',
    desc: 'Automatically summarise dozens of testimonials into key positives, complaints, and sentiment scores.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: <Zap size={22} />,
    title: 'Smart Question AI',
    desc: 'AI suggests the best questions tailored to your business type and target audience.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Embeddable Walls',
    desc: 'Beautiful masonry, animated, and carousel walls you can embed on any website with one line of code.',
    color: 'from-emerald-500 to-teal-500',
  },
];

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Founder, Launchpad', text: 'We went from 0 to 50 testimonials in a week. The AI summary alone saved us hours of analysis.', rating: 5, avatar: 'SK' },
  { name: 'Marcus T.', role: 'Marketing Director', text: 'The wall of love embed is gorgeous. Our conversion rate jumped 18% after adding it to our landing page.', rating: 5, avatar: 'MT' },
  { name: 'Priya R.', role: 'SaaS Founder', text: 'Incredibly easy to set up. The video testimonials feature blew our customers away.', rating: 5, avatar: 'PR' },
];

// ── Wall of Love Preview Component ──────────────────────────────────────────
const WallOfLovePreview = () => {
  const [embedCode, setEmbedCode] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);

  const PLACEHOLDER = `<!-- Paste your TestiQra embed code here -->
<div id="testiqra-wall" data-space="your-space-name"></div>
<script src="https://testiqra.io/embed.js" async></script>`;

  const extractSrc = (code) => {
    // Try to find an iframe src
    const iframeSrcMatch = code.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeSrcMatch) return { type: 'iframe', src: iframeSrcMatch[1] };

    // Try to find a script + div combo (typical wall embed)
    const dataSpaceMatch = code.match(/data-space=["']([^"']+)["']/i);
    if (dataSpaceMatch) return { type: 'widget', space: dataSpaceMatch[1] };

    // Try raw URL
    try {
      const url = new URL(code.trim());
      return { type: 'iframe', src: url.href };
    } catch {}

    return null;
  };

  const handlePreview = () => {
    setError('');
    if (!embedCode.trim() || embedCode.trim() === PLACEHOLDER) {
      setError('Please paste your embed code first.');
      return;
    }

    const parsed = extractSrc(embedCode);
    if (!parsed) {
      setError('Could not parse embed code. Try pasting an iframe or script embed.');
      return;
    }

    if (parsed.type === 'iframe') {
      setPreviewUrl(parsed.src);
    } else {
      setError(`Widget embed detected for space "${parsed.space}". Live preview uses iframe embeds. Copy your iframe embed from the dashboard.`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setEmbedCode('');
    setPreviewUrl('');
    setError('');
  };

  return (
    <section className="py-24 px-6 bg-gray-950">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-6 font-medium">
            <Eye size={14} /> Live Wall Preview
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            See your Wall of Love <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">before you ship</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Paste your embed code below and instantly preview how your testimonial wall will look on your site.
          </p>
        </div>

        {/* Main card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Code2 size={13} className="text-emerald-400" />
              </div>
              <span className="text-white font-semibold text-sm">Embed Code Preview</span>
            </div>
            <div className="flex items-center gap-2">
              {embedCode && (
                <>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg text-xs transition-all"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 rounded-lg text-xs transition-all"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-800">
            {/* Left: Code input */}
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Your Embed Code</label>
                <div className="relative">
                  <textarea
                    value={embedCode}
                    onChange={e => { setEmbedCode(e.target.value); setError(''); setPreviewUrl(''); }}
                    placeholder={PLACEHOLDER}
                    rows={10}
                    spellCheck={false}
                    className="w-full bg-gray-950 border border-gray-700/60 hover:border-gray-600 focus:border-emerald-500/50 rounded-2xl px-4 py-4 text-emerald-300 text-xs font-mono placeholder-gray-700 focus:outline-none transition-all resize-none leading-relaxed"
                  />
                  {/* Syntax highlight hint */}
                  {!embedCode && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-gray-700 text-xs pointer-events-none">
                      <Code2 size={11} />
                      <span>HTML / iframe</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <span className="text-red-400 text-xs leading-relaxed">{error}</span>
                </div>
              )}

              <button
                onClick={handlePreview}
                disabled={!embedCode.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20"
              >
                <Eye size={15} />
                Preview Wall
              </button>

              {/* Tips */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 space-y-2">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">How to get your embed code</p>
                {[
                  'Go to your TestiQra Dashboard',
                  'Open your Space → click "Embed"',
                  'Copy the iframe or script snippet',
                  'Paste it in the box above',
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-gray-500 text-xs">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Preview pane */}
            <div className="p-6 flex flex-col">
              <label className="text-gray-400 text-xs uppercase tracking-wider mb-3 block flex items-center gap-1.5">
                <Eye size={11} /> Live Preview
              </label>

              <div className="flex-1 bg-gray-950 border border-gray-700/50 rounded-2xl overflow-hidden relative min-h-[360px]">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 border-b border-gray-700/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  <div className="flex-1 mx-3 bg-gray-800 rounded-md px-3 py-1 text-gray-600 text-xs truncate">
                    {previewUrl || 'your-wall-preview'}
                  </div>
                </div>

                {previewUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    title="Wall of Love Preview"
                    className="w-full h-full min-h-[320px] border-0"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                ) : (
                  /* Empty state */
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    {/* Simulated wall skeleton */}
                    <div className="w-full max-w-sm space-y-3 mb-6 opacity-30">
                      {[...Array(3)].map((_, row) => (
                        <div key={row} className="grid grid-cols-2 gap-3">
                          {[...Array(2)].map((_, col) => (
                            <div key={col} className={`bg-gray-800 rounded-xl p-3 ${col === 1 && row === 1 ? 'col-span-2' : ''}`}>
                              <div className="flex gap-0.5 mb-2">
                                {[...Array(5)].map((_, s) => (
                                  <div key={s} className="w-2 h-2 rounded-full bg-amber-500/50" />
                                ))}
                              </div>
                              <div className="space-y-1.5">
                                <div className="h-1.5 bg-gray-700 rounded-full w-full" />
                                <div className="h-1.5 bg-gray-700 rounded-full w-4/5" />
                                <div className="h-1.5 bg-gray-700 rounded-full w-3/5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                      <Eye size={20} className="text-emerald-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Your wall will appear here</p>
                    <p className="text-gray-700 text-xs mt-1">Paste your embed code and click Preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function Landingpage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handle = (e) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <span className="font-bold text-lg">TestiQra</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/signin')}
              className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl hover:bg-gray-800 transition-all">
              Sign in
            </button>
            <button onClick={() => navigate('/signup')}
              className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all font-medium shadow-lg shadow-violet-500/20">
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative pt-28 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 left-20 w-[300px] h-[300px] bg-indigo-500/8 rounded-full blur-3xl"
            style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }} />
          <div className="absolute top-20 right-20 w-[200px] h-[200px] bg-violet-400/8 rounded-full blur-3xl"
            style={{ transform: `translate(${-mousePos.x * 15}px, ${mousePos.y * 15}px)` }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-sm mb-8 font-medium">
            <Sparkles size={14} /> AI-powered testimonial collection
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.05] tracking-tight">
            Turn customers into{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                your best salespeople
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                <path d="M0 6 Q25 0 50 4 Q75 8 100 2" fill="none" stroke="url(#underline)" strokeWidth="2" />
                <defs>
                  <linearGradient id="underline" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Collect text and video testimonials, get AI-powered insights, and embed beautiful social proof walls — no developer needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => navigate('/signup')}
              className="group flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-semibold text-base transition-all shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40">
              Start for free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center gap-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-2xl font-medium text-base transition-all">
              See it in action
            </button>
          </div>

          <p className="text-gray-600 text-sm mt-4">No credit card required · Free forever plan available</p>
        </div>
      </section>

      {/* ── Social Proof Strip ── */}
      <section className="py-8 border-y border-gray-800 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { value: '10,000+', label: 'Testimonials collected' },
            { value: '500+', label: 'Businesses trust us' },
            { value: '4.9★', label: 'Average rating' },
            { value: '2 min', label: 'Setup time' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Everything you need</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">From collection to conversion — one platform handles it all</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map(f => (
              <div key={f.title}
                className="bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-all group hover:-translate-y-0.5">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 text-white shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-6 bg-gray-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Loved by businesses</h2>
            <p className="text-gray-400">Don't take our word for it</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.rating).fill(0).map((_, i) => <Star key={i} size={14} className="text-amber-400" fill="currentColor" />)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wall of Love Preview */}
      <WallOfLovePreview />

      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-600 text-sm">
        <p>© 2024 TestiQra. </p>
      </footer>
    </div>
  );
}