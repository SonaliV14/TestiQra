import React, { useState, useEffect } from 'react';
import { Star, Heart, Copy, Check, ExternalLink, Grid3X3, LayoutList, Sparkles, Filter, SortAsc, SortDesc, Search, X, Play, ChevronLeft, ChevronRight, Zap, Video, FileText, MessageSquare } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import axios from 'axios';
import { BACKEND_URL } from '../utils/DB';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

// ─── Star Display ─────────────────────────────────────────────────────────────
const Stars = ({ value, size = 14 }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} size={size} className={s <= value ? 'text-amber-400' : 'text-gray-700'} fill={s <= value ? 'currentColor' : 'none'} />
    ))}
  </div>
);

// ─── Testimonial Card ─────────────────────────────────────────────────────────
const TestimonialCard = React.memo(({ testimonial, isDark, showDate, showRating, compact, onExpand }) => {
  const isVideo = !testimonial.isTextContent;

  return (
    <div
      onClick={() => isVideo && onExpand && onExpand(testimonial)}
      className={`group relative break-inside-avoid mb-4 rounded-2xl border transition-all duration-300
        ${isDark
          ? 'bg-gray-900/80 border-white/8 hover:border-white/15 hover:bg-gray-800/80'
          : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-lg'
        }
        ${isVideo ? 'cursor-pointer' : ''}
      `}
    >
      {/* Accent line for high-rated */}
      {testimonial.Rating >= 5 && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-amber-400 to-orange-400 opacity-60" />
      )}

      <div className={`${compact ? 'p-4' : 'p-5'}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={testimonial.UserImageURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(testimonial.username)}&backgroundColor=5b21b6&textColor=ffffff`}
                alt={testimonial.username}
                className="w-9 h-9 rounded-xl object-cover border border-white/10 bg-gray-800"
              />
              {isVideo && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <Video size={8} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <p className={`font-semibold text-sm leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {testimonial.username}
              </p>
              {showRating && <Stars value={testimonial.Rating} />}
            </div>
          </div>
          {isVideo && (
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-500'}`}>
              <Play size={12} fill="currentColor" />
            </div>
          )}
        </div>

        {/* Video thumbnail */}
        {isVideo && (
          <div className="relative mb-3 rounded-xl overflow-hidden bg-black aspect-video border border-white/8 group-hover:border-white/15 transition-colors">
            <video src={testimonial.videoUrl || testimonial.Content} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all group-hover:scale-110 ${isDark ? 'bg-white/15 border-white/20' : 'bg-black/30 border-white/20'}`}>
                <Play size={14} fill="white" className="text-white ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* Image */}
        {testimonial.imageURL && (
          <img src={testimonial.imageURL} alt="" className="w-full rounded-xl mb-3 object-cover max-h-52 border border-white/8" />
        )}

        {/* Content */}
        {!isVideo && testimonial.Content && (
          <p className={`text-sm leading-relaxed ${compact ? 'line-clamp-3' : 'line-clamp-5'} ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            "{testimonial.Content}"
          </p>
        )}

        {/* Footer */}
        {showDate && (
          <p className={`text-xs mt-3 pt-3 border-t ${isDark ? 'text-gray-600 border-white/6' : 'text-gray-400 border-gray-100'}`}>
            {formatDate(testimonial.submittedAt)}
          </p>
        )}
      </div>
    </div>
  );
});

TestimonialCard.displayName = 'TestimonialCard';

// ─── Video Modal ──────────────────────────────────────────────────────────────
const VideoModal = ({ testimonial, onClose }) => {
  if (!testimonial) return null;
  const videoSrc = testimonial.videoUrl || testimonial.Content;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <img src={testimonial.UserImageURL || ''} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/10" />
            <div>
              <p className="text-white font-medium text-sm">{testimonial.username}</p>
              <Stars value={testimonial.Rating} size={12} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/4 hover:bg-white/8 text-gray-400 hover:text-white transition-all"><X size={15} /></button>
        </div>
        <div className="bg-black aspect-video">
          <video src={videoSrc} controls autoPlay className="w-full h-full object-contain" />
        </div>
        {testimonial.Content && testimonial.Content !== '[Video Testimonial]' && (
          <div className="p-4 border-t border-white/8">
            <p className="text-gray-300 text-sm leading-relaxed">"{testimonial.Content}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Carousel Layout ──────────────────────────────────────────────────────────
const CarouselLayout = ({ testimonials, isDark, showDate, showRating, onExpand }) => {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay || testimonials.length <= 3) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % Math.ceil(testimonials.length / 3)), 4000);
    return () => clearInterval(t);
  }, [autoPlay, testimonials.length]);

  const totalSlides = Math.ceil(testimonials.length / 3);
  const visibleItems = testimonials.slice(current * 3, current * 3 + 3);

  return (
    <div className="relative" onMouseEnter={() => setAutoPlay(false)} onMouseLeave={() => setAutoPlay(true)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[280px]">
        {visibleItems.map((t, i) => (
          <div key={t.id} className="transition-all duration-500" style={{ animationDelay: `${i * 0.1}s` }}>
            <TestimonialCard testimonial={t} isDark={isDark} showDate={showDate} showRating={showRating} onExpand={onExpand} />
          </div>
        ))}
      </div>
      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0}
            className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-white/4 border-white/10 text-white disabled:opacity-30 hover:bg-white/8' : 'bg-white border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50'} disabled:cursor-not-allowed`}>
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? (isDark ? 'bg-violet-400 w-6' : 'bg-violet-600 w-6') : (isDark ? 'bg-white/20 w-1.5' : 'bg-gray-300 w-1.5')}`} />
            ))}
          </div>
          <button onClick={() => setCurrent(p => Math.min(totalSlides - 1, p + 1))} disabled={current === totalSlides - 1}
            className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-white/4 border-white/10 text-white disabled:opacity-30 hover:bg-white/8' : 'bg-white border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50'} disabled:cursor-not-allowed`}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Wall of Love Page ───────────────────────────────────────────────────
const TestimonialWall = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spaceInfo, setSpaceInfo] = useState(null);
  const [expandedVideo, setExpandedVideo] = useState(null);
  const [copied, setCopied] = useState(false);
  const { spacename } = useParams();
  const [searchParams] = useSearchParams();

  // Settings
  const isDark = searchParams.get('darktheme') === 'true';
  const showDate = searchParams.get('hidedate') !== 'true';
  const showRating = searchParams.get('showrating') !== 'false';

  // Local UI state
  const [layout, setLayout] = useState('masonry'); // masonry | grid | carousel | list
  const [sort, setSort] = useState('newest');
  const [filter, setFilter] = useState('all'); // all | text | video | 5star
  const [search, setSearch] = useState('');
  const [compact, setCompact] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const breakpointCols = { default: 3, 1100: 2, 700: 1 };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [testimonialsRes, spaceRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/v1/fetchtestimonials`, {
            params: { spacename },
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
          }),
          axios.get(`${BACKEND_URL}/api/v1/spaceinfo`, {
            params: { spacename },
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
          })
        ]);
        const liked = (testimonialsRes.data.testimonials || []).filter(t => t.liked);
        setTestimonials(liked);
        setSpaceInfo(spaceRes.data.spaceinfo);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [spacename]);

  useEffect(() => {
    let list = [...testimonials];

    // Filter
    if (filter === 'text') list = list.filter(t => t.isTextContent);
    if (filter === 'video') list = list.filter(t => !t.isTextContent);
    if (filter === '5star') list = list.filter(t => t.Rating === 5);
    if (filter === '4star') list = list.filter(t => t.Rating >= 4);

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.username?.toLowerCase().includes(q) ||
        t.Content?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sort === 'newest') list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    if (sort === 'oldest') list.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    if (sort === 'rating') list.sort((a, b) => b.Rating - a.Rating);

    setFiltered(list);
  }, [testimonials, filter, sort, search]);

  const stats = {
    total: testimonials.length,
    avgRating: testimonials.length ? (testimonials.reduce((s, t) => s + t.Rating, 0) / testimonials.length).toFixed(1) : 0,
    video: testimonials.filter(t => !t.isTextContent).length,
    fiveStar: testimonials.filter(t => t.Rating === 5).length,
  };

  const copyEmbedCode = () => {
    const code = `<iframe src="${window.location.href}" frameborder="0" scrolling="yes" width="100%" height="600px"></iframe>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-10 h-10 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-violet-500' : 'border-violet-600'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading testimonials…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-[#08090f] text-white' : 'bg-gray-50 text-gray-900'}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');`}</style>

      {expandedVideo && <VideoModal testimonial={expandedVideo} onClose={() => setExpandedVideo(null)} />}

      {/* Hero */}
      <div className={`relative ${isDark ? 'bg-gradient-to-b from-violet-950/30 to-transparent' : 'bg-gradient-to-b from-violet-50 to-transparent'} border-b ${isDark ? 'border-white/6' : 'border-gray-200'}`}>
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          {spaceInfo?.logo && (
            <img src={spaceInfo.logo} alt="" className="w-14 h-14 rounded-2xl object-cover mx-auto mb-4 border border-white/10 shadow-lg" />
          )}
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
            className={`text-3xl md:text-4xl mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Wall of Love ❤️
          </h1>
          <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {filtered.length} testimonial{filtered.length !== 1 ? 's' : ''} from happy customers
          </p>

          {/* Stats Row */}
          {showStats && stats.total > 0 && (
            <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
              {[
                { label: 'Avg Rating', value: `${stats.avgRating}★`, color: isDark ? 'text-amber-400' : 'text-amber-600' },
                { label: '5-Star Reviews', value: stats.fiveStar, color: isDark ? 'text-emerald-400' : 'text-emerald-600' },
                { label: 'Video Reviews', value: stats.video, color: isDark ? 'text-violet-400' : 'text-violet-600' },
                { label: 'Total Loved', value: stats.total, color: isDark ? 'text-rose-400' : 'text-rose-600' },
              ].map(s => (
                <div key={s.label} className={`flex flex-col items-center px-4 py-2 rounded-xl ${isDark ? 'bg-white/4 border border-white/8' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Embed button */}
          <button onClick={copyEmbedCode}
            className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all
              ${isDark ? 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
            {copied ? <><Check size={12} className="text-emerald-400" /> Embed code copied!</> : <><Copy size={12} /> Copy embed code</>}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Controls Bar */}
        <div className={`flex flex-wrap items-center gap-3 mb-6 p-4 rounded-2xl border ${isDark ? 'bg-white/3 border-white/8' : 'bg-white border-gray-200'} shadow-sm`}>
          {/* Search */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-40 ${isDark ? 'bg-white/4 border-white/8' : 'bg-gray-50 border-gray-200'}`}>
            <Search size={13} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search testimonials…"
              className={`bg-transparent text-sm focus:outline-none flex-1 ${isDark ? 'text-white placeholder-gray-700' : 'text-gray-900 placeholder-gray-400'}`} />
            {search && <button onClick={() => setSearch('')}><X size={12} className={isDark ? 'text-gray-600' : 'text-gray-400'} /></button>}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'text', label: '📝 Text' },
              { id: 'video', label: '📹 Video' },
              { id: '5star', label: '⭐ 5-Star' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                  ${filter === f.id
                    ? (isDark ? 'bg-violet-600 border-violet-500 text-white' : 'bg-violet-600 border-violet-500 text-white')
                    : (isDark ? 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700')
                  }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs border focus:outline-none cursor-pointer transition-all
              ${isDark ? 'bg-white/4 border-white/8 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rating">Highest rated</option>
          </select>

          {/* Layout toggle */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? 'bg-white/4 border-white/8' : 'bg-gray-50 border-gray-200'}`}>
            {[
              { id: 'masonry', icon: <Grid3X3 size={13} /> },
              { id: 'carousel', icon: <LayoutList size={13} /> },
            ].map(l => (
              <button key={l.id} onClick={() => setLayout(l.id)}
                className={`p-1.5 rounded-lg transition-all ${layout === l.id ? (isDark ? 'bg-violet-600 text-white' : 'bg-violet-600 text-white') : (isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-700')}`}>
                {l.icon}
              </button>
            ))}
          </div>

          {/* Compact toggle */}
          <button onClick={() => setCompact(c => !c)}
            className={`px-3 py-1.5 rounded-xl text-xs border transition-all
              ${compact
                ? (isDark ? 'bg-violet-600/20 border-violet-500/30 text-violet-400' : 'bg-violet-50 border-violet-200 text-violet-600')
                : (isDark ? 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100')}`}>
            {compact ? 'Compact' : 'Comfortable'}
          </button>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/4 border border-white/8' : 'bg-gray-100 border border-gray-200'}`}>
              <Heart size={26} className={isDark ? 'text-gray-700' : 'text-gray-300'} />
            </div>
            <p className={`font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {search || filter !== 'all' ? 'No testimonials match your filters' : 'No testimonials yet'}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {search || filter !== 'all' ? 'Try adjusting your search or filter' : 'Like some testimonials to show them here'}
            </p>
          </div>
        )}

        {/* Testimonials */}
        {filtered.length > 0 && (
          <>
            {layout === 'masonry' && (
              <>
                <style>{`
                  .wall-masonry { display: flex; margin-left: -16px; width: auto; }
                  .wall-masonry_col { padding-left: 16px; background-clip: padding-box; }
                `}</style>
                <Masonry breakpointCols={breakpointCols} className="wall-masonry" columnClassName="wall-masonry_col">
                  {filtered.map(t => (
                    <TestimonialCard key={t.id} testimonial={t} isDark={isDark} showDate={showDate} showRating={showRating} compact={compact} onExpand={setExpandedVideo} />
                  ))}
                </Masonry>
              </>
            )}

            {layout === 'carousel' && (
              <CarouselLayout testimonials={filtered} isDark={isDark} showDate={showDate} showRating={showRating} onExpand={setExpandedVideo} />
            )}
          </>
        )}

        {/* Footer */}
        <div className={`text-center mt-12 pb-6 text-xs flex items-center justify-center gap-1.5 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
          Powered by
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-violet-600 inline-flex items-center justify-center">
              <Zap size={9} fill="white" className="text-white" />
            </span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
              className={isDark ? 'text-gray-600' : 'text-gray-400'}>TestiQra</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TestimonialWall;