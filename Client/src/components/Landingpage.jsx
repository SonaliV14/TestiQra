import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Zap, Shield, BarChart2, MessageSquare, Video, Sparkles } from 'lucide-react';

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

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-600/10 rounded-3xl blur-3xl" />
            <div className="relative bg-gray-900 border border-gray-700 rounded-3xl p-12">
              <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-500/30">
                <Sparkles size={28} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to collect social proof that converts?
              </h2>
              <p className="text-gray-400 mb-8 text-lg">Join hundreds of businesses that trust TestiQra</p>
              <button onClick={() => navigate('/signup')}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-semibold text-base transition-all shadow-2xl shadow-violet-500/25">
                Get started for free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-600 text-sm">
        <p>© 2024 TestiQra. Built with ❤️</p>
      </footer>
    </div>
  );
}