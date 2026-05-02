import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Star, Heart, Copy, Check, X, Search,
  Grid3X3, List, LayoutGrid, Rows3, Sparkles,
  ChevronLeft, ChevronRight, Zap, ExternalLink,
  Play, Pause, Quote, TrendingUp, Film
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:3001';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Stars = ({ rating = 5 }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={12}
        className={i <= rating ? 'text-amber-400' : 'text-gray-700'}
        fill={i <= rating ? 'currentColor' : 'none'} />
    ))}
  </div>
);

const Avatar = ({ name = '', photo, size = 36 }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const palette = ['#7c3aed','#0891b2','#059669','#d97706','#db2777','#dc2626'];
  const bg = palette[(name.charCodeAt(0) || 0) % palette.length];
  if (photo) return (
    <img src={photo} alt={name} width={size} height={size}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.08)', flexShrink: 0 }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff',
      border: '2px solid rgba(255,255,255,0.08)',
    }}>{initials || '?'}</div>
  );
};

// ─── Video Card ───────────────────────────────────────────────────────────────
const VideoCard = ({ t, variant = 'default' }) => {
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);
  const toggle = () => {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); setPlaying(false); }
    else { ref.current.play(); setPlaying(true); }
  };
  return (
    <div className={`wol-card ${variant}`}>
      <div className="wol-video-wrap" onClick={toggle}>
        <video ref={ref} src={t.videoUrl || t.VideoURL}
          style={{ width: '100%', display: 'block', borderRadius: '10px 10px 0 0', maxHeight: 200, objectFit: 'cover' }}
          onEnded={() => setPlaying(false)} />
        {!playing && (
          <div className="wol-play-overlay">
            <div className="wol-play-btn"><Play size={18} fill="currentColor" /></div>
          </div>
        )}
        <span className="wol-video-badge"><Film size={10} /> Video</span>
      </div>
      <div className="wol-card-body">
        <Stars rating={t.Rating || t.rating} />
        {(t.Content || t.text) && <p className="wol-text">"{t.Content || t.text}"</p>}
        <div className="wol-author">
          <Avatar name={t.username || t.name} photo={t.UserImageURL || t.photo} size={32} />
          <div>
            <p className="wol-author-name">{t.username || t.name}</p>
            {t.role && <p className="wol-author-meta">{t.role}{t.company ? ` · ${t.company}` : ''}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Text Card ────────────────────────────────────────────────────────────────
const TextCard = ({ t, variant = 'default', featured = false }) => (
  <div className={`wol-card ${variant} ${featured ? 'featured' : ''}`}>
    <div className="wol-card-body">
      <div className="wol-card-top">
        <Stars rating={t.Rating || t.rating} />
        {featured && <span className="wol-featured-badge">✦ Featured</span>}
      </div>
      <p className="wol-text">"{t.Content || t.text}"</p>
      {(t.imageURL || t.image) && (
        <img src={t.imageURL || t.image} alt="" className="wol-inline-img" />
      )}
      <div className="wol-author">
        <Avatar name={t.username || t.name} photo={t.UserImageURL || t.photo} size={32} />
        <div>
          <p className="wol-author-name">{t.username || t.name}</p>
          {t.email && <p className="wol-author-meta">{t.email}</p>}
          <p className="wol-date">
            {new Date(t.submittedAt || t.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  </div>
);

// ─── Card Router ──────────────────────────────────────────────────────────────
const Card = ({ t, variant, index }) => {
  if (t.videoUrl || t.VideoURL) return <VideoCard t={t} variant={variant} />;
  return <TextCard t={t} variant={variant} featured={index === 0} />;
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 1 — Masonry (3-col Pinterest style)
// ════════════════════════════════════════════════════════════════════
const MasonryLayout = ({ items }) => {
  const cols = [[], [], []];
  items.forEach((t, i) => cols[i % 3].push({ t, i }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {col.map(({ t, i }) => <Card key={t.id || i} t={t} variant="masonry" index={i} />)}
        </div>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 2 — Grid (uniform 2-col)
// ════════════════════════════════════════════════════════════════════
const GridLayout = ({ items }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
    {items.map((t, i) => <Card key={t.id || i} t={t} variant="grid" index={i} />)}
  </div>
);

// ════════════════════════════════════════════════════════════════════
// LAYOUT 3 — List (single column, wide)
// ════════════════════════════════════════════════════════════════════
const ListLayout = ({ items }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760, margin: '0 auto' }}>
    {items.map((t, i) => (
      <div key={t.id || i} className="wol-card list"
        style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <Avatar name={t.username || t.name} photo={t.UserImageURL || t.photo} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <p className="wol-author-name">{t.username || t.name}</p>
              {t.email && <p className="wol-author-meta">{t.email}</p>}
            </div>
            <Stars rating={t.Rating || t.rating} />
          </div>
          <p className="wol-text" style={{ margin: 0 }}>"{t.Content || t.text}"</p>
          {(t.imageURL) && <img src={t.imageURL} alt="" className="wol-inline-img" style={{ marginTop: 10 }} />}
          <p className="wol-date" style={{ marginTop: 8 }}>
            {new Date(t.submittedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    ))}
  </div>
);

// ════════════════════════════════════════════════════════════════════
// LAYOUT 4 — Carousel (sliding cards)
// ════════════════════════════════════════════════════════════════════
const CarouselLayout = ({ items }) => {
  const [idx, setIdx] = useState(0);
  const visible = 3;
  const max = Math.max(0, items.length - visible);

  // auto-advance
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i >= max ? 0 : i + 1)), 4000);
    return () => clearInterval(t);
  }, [max]);

  return (
    <div style={{ position: 'relative', padding: '0 48px' }}>
      <button className="wol-arrow left" onClick={() => setIdx(i => Math.max(0, i-1))} disabled={idx === 0}>
        <ChevronLeft size={18} />
      </button>
      <div style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 16, transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)', transform: `translateX(calc(-${idx} * (340px + 16px)))` }}>
          {items.map((t, i) => (
            <div key={t.id || i} style={{ minWidth: 320, flexShrink: 0 }}>
              <Card t={t} variant="carousel" index={i} />
            </div>
          ))}
        </div>
      </div>
      <button className="wol-arrow right" onClick={() => setIdx(i => Math.min(max, i+1))} disabled={idx >= max}>
        <ChevronRight size={18} />
      </button>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
        {Array.from({ length: max + 1 }).map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', transition: 'all 200ms', background: i === idx ? '#06b6d4' : '#334155' }} />
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 5 — Featured (1 hero + grid below)
// ════════════════════════════════════════════════════════════════════
const FeaturedLayout = ({ items }) => {
  const [hero, ...rest] = items;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {hero && (
        <div className="wol-card featured hero" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <Quote size={48} style={{ color: 'rgba(6,182,212,0.2)', flexShrink: 0, marginTop: 4 }} />
            <div style={{ flex: 1 }}>
              <Stars rating={hero.Rating || hero.rating} />
              <p className="wol-text" style={{ fontSize: '1.15rem', margin: '12px 0' }}>"{hero.Content || hero.text}"</p>
              <div className="wol-author" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 16 }}>
                <Avatar name={hero.username || hero.name} photo={hero.UserImageURL || hero.photo} size={44} />
                <div>
                  <p className="wol-author-name" style={{ fontSize: '0.95rem' }}>{hero.username || hero.name}</p>
                  {hero.email && <p className="wol-author-meta">{hero.email}</p>}
                </div>
                <span className="wol-featured-badge" style={{ marginLeft: 'auto' }}>✦ Top Pick</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
        {rest.map((t, i) => <Card key={t.id || i} t={t} variant="grid" index={i+1} />)}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 6 — Marquee (two auto-scrolling rows) — NEW
// ════════════════════════════════════════════════════════════════════
const MarqueeRow = ({ items, reverse = false, speed = 35 }) => {
  const doubled = [...items, ...items]; // duplicate for seamless loop
  return (
    <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
      <div style={{
        display: 'flex', gap: 16,
        animation: `wol-marquee${reverse ? '-rev' : ''} ${speed}s linear infinite`,
        width: 'max-content',
      }}>
        {doubled.map((t, i) => (
          <div key={i} style={{ width: 300, flexShrink: 0 }}>
            <Card t={t} variant="marquee" index={i} />
          </div>
        ))}
      </div>
    </div>
  );
};

const MarqueeLayout = ({ items }) => {
  const half = Math.ceil(items.length / 2);
  const row1 = items.slice(0, half);
  const row2 = items.slice(half);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <MarqueeRow items={row1.length ? row1 : items} speed={40} />
      <MarqueeRow items={row2.length ? row2 : items} reverse speed={35} />
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 7 — Spotlight (big quote rotator) — NEW
// ════════════════════════════════════════════════════════════════════
const SpotlightLayout = ({ items }) => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);
  const t = items[active];
  if (!t) return null;
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
      <div className="wol-card featured" style={{ padding: '3rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 120, lineHeight: 1, color: 'rgba(6,182,212,0.05)', fontFamily: 'Georgia, serif', userSelect: 'none' }}>"</div>
        <Stars rating={t.Rating || t.rating} />
        <p className="wol-text" style={{ fontSize: '1.25rem', lineHeight: 1.8, margin: '1.5rem 0', color: '#e2e8f0' }}>
          "{t.Content || t.text}"
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Avatar name={t.username || t.name} photo={t.UserImageURL || t.photo} size={44} />
          <div style={{ textAlign: 'left' }}>
            <p className="wol-author-name">{t.username || t.name}</p>
            {t.email && <p className="wol-author-meta">{t.email}</p>}
          </div>
        </div>
      </div>
      {/* Thumbnails */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
        {items.map((item, i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${i === active ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.08)'}`, background: i === active ? 'rgba(6,182,212,0.1)' : 'transparent', color: i === active ? '#06b6d4' : '#64748b', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 150ms' }}>
            {(item.username || item.name || '').split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 8 — Animated Scroll (auto-scrolling masonry) — NEW
// ════════════════════════════════════════════════════════════════════
const AnimatedScrollLayout = ({ items }) => {
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const cols = [[], [], []];
  items.forEach((t, i) => cols[i % 3].push({ t, i }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const step = () => {
      if (!paused && el.scrollTop < el.scrollHeight - el.clientHeight) {
        el.scrollTop += 0.8;
      } else if (!paused && el.scrollTop >= el.scrollHeight - el.clientHeight - 2) {
        el.scrollTop = 0;
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [paused]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ maxHeight: 600, overflowY: 'hidden', scrollbarWidth: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {col.map(({ t, i }) => <Card key={t.id || i} t={t} variant="masonry" index={i} />)}
            </div>
          ))}
        </div>
      </div>
      {/* Fade overlays */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom, #080a0f, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, #080a0f, transparent)', pointerEvents: 'none' }} />
      <button onClick={() => setPaused(p => !p)}
        style={{ position: 'absolute', bottom: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(13,17,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </div>
  );
};

// ─── Embed Panel ──────────────────────────────────────────────────────────────
const EmbedPanel = ({ spacename, layout, onClose }) => {
  const [copied, setCopied] = useState('');
  const origin = window.location.origin;
  const iframeCode = `<iframe src="${origin}/testimonialwall/${spacename}?layout=${layout}" width="100%" height="600" frameborder="0" style="border-radius:16px;border:none;"></iframe>`;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '1.75rem', maxWidth: 540, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600 }}>Embed Your Wall</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Paste this into your website to embed your Wall of Love.</p>
        <div style={{ background: '#080a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
          <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', display: 'block', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{iframeCode}</code>
          <button onClick={() => copy(iframeCode, 'iframe')}
            style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, color: '#06b6d4', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            {copied === 'iframe' ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy iFrame</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Layout Config ────────────────────────────────────────────────────────────
const LAYOUTS = [
  { id: 'masonry',  label: 'Masonry',    icon: <LayoutGrid size={13} />,  desc: 'Pinterest-style columns' },
  { id: 'grid',     label: 'Grid',       icon: <Grid3X3 size={13} />,     desc: 'Uniform card grid' },
  { id: 'list',     label: 'List',       icon: <List size={13} />,        desc: 'Single column feed' },
  { id: 'carousel', label: 'Carousel',   icon: <Rows3 size={13} />,       desc: 'Sliding cards' },
  { id: 'featured', label: 'Featured',   icon: <Star size={13} />,        desc: 'Hero + grid' },
  { id: 'marquee',  label: 'Marquee',    icon: <TrendingUp size={13} />,  desc: 'Auto-scrolling rows' },
  { id: 'spotlight',label: 'Spotlight',  icon: <Sparkles size={13} />,    desc: 'Rotating big quote' },
  { id: 'animated', label: 'Auto-Scroll',icon: <Zap size={13} />,         desc: 'Animated masonry' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WallOfLove() {
  const { spacename } = useParams();
  const navigate = useNavigate();

  const [testimonials, setTestimonials] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState('masonry');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [showEmbed, setShowEmbed] = useState(false);
  const [spaceInfo, setSpaceInfo] = useState(null);
  const [stats, setStats] = useState({ total: 0, avg: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      axios.get(`${BACKEND_URL}/api/v1/fetchtestimonials`, {
        params: { spacename },
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { testimonials: [] } })),
      axios.get(`${BACKEND_URL}/api/v1/spaceinfo`, {
        params: { spacename },
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: null })),
    ]).then(([tRes, sRes]) => {
      const list = tRes.data?.testimonials || [];
      setTestimonials(list);
      setSpaceInfo(sRes.data?.spaceinfo || null);
      const avg = list.length ? (list.reduce((s, t) => s + (t.Rating || 0), 0) / list.length).toFixed(1) : 0;
      setStats({ total: list.length, avg });
      setLoading(false);
    });
  }, [spacename]);

  useEffect(() => {
    let list = [...testimonials];
    if (filter === 'video') list = list.filter(t => t.videoUrl || t.VideoURL);
    if (filter === 'text') list = list.filter(t => !t.videoUrl && !t.VideoURL);
    if (filter === 'liked') list = list.filter(t => t.liked);
    if (minRating > 0) list = list.filter(t => (t.Rating || 0) >= minRating);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => [t.username, t.name, t.Content, t.text, t.email].join(' ').toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [testimonials, filter, minRating, search]);

  const renderLayout = () => {
    if (loading) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', animation: 'wol-spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading testimonials…</p>
      </div>
    );
    if (!filtered.length) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={24} style={{ color: '#334155' }} />
        </div>
        <p style={{ color: '#475569', fontWeight: 500 }}>No testimonials found</p>
        <p style={{ color: '#334155', fontSize: '0.875rem' }}>Try adjusting your filters</p>
      </div>
    );
    switch (layout) {
      case 'grid':      return <GridLayout items={filtered} />;
      case 'list':      return <ListLayout items={filtered} />;
      case 'carousel':  return <CarouselLayout items={filtered} />;
      case 'featured':  return <FeaturedLayout items={filtered} />;
      case 'marquee':   return <MarqueeLayout items={filtered} />;
      case 'spotlight': return <SpotlightLayout items={filtered} />;
      case 'animated':  return <AnimatedScrollLayout items={filtered} />;
      default:          return <MasonryLayout items={filtered} />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

        .wol-page {
          min-height: 100vh;
          background: #080a0f;
          color: #f1f5f9;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Cards ── */
        .wol-card {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 250ms, transform 250ms, box-shadow 250ms;
          animation: wol-fadeUp 0.4s ease both;
        }
        .wol-card:hover {
          border-color: rgba(6,182,212,0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .wol-card.featured {
          border-color: rgba(6,182,212,0.2);
          background: linear-gradient(145deg, #0d1520 0%, #0d1117 100%);
        }
        .wol-card.featured:hover { border-color: rgba(6,182,212,0.4); box-shadow: 0 0 32px rgba(6,182,212,0.08); }
        .wol-card.hero { border-color: rgba(6,182,212,0.25); }
        .wol-card-body { padding: 1.1rem; }
        .wol-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .wol-text { color: #cbd5e1; font-size: 0.875rem; line-height: 1.75; margin: 10px 0; }
        .wol-author { display: flex; align-items: center; gap: 10px; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .wol-author-name { font-size: 0.85rem; font-weight: 600; color: #f1f5f9; }
        .wol-author-meta { font-size: 0.75rem; color: #64748b; margin-top: 1px; }
        .wol-date { font-size: 0.72rem; color: #475569; margin-top: 2px; }
        .wol-featured-badge { font-size: 0.68rem; font-weight: 700; color: #06b6d4; background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.2); border-radius: 999px; padding: 2px 8px; white-space: nowrap; }
        .wol-inline-img { width: 100%; border-radius: 8px; margin-top: 10px; max-height: 180px; object-fit: cover; border: 1px solid rgba(255,255,255,0.06); }

        /* ── Video ── */
        .wol-video-wrap { position: relative; cursor: pointer; }
        .wol-play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35); border-radius: 10px 10px 0 0; transition: background 150ms; }
        .wol-video-wrap:hover .wol-play-overlay { background: rgba(0,0,0,0.55); }
        .wol-play-btn { width: 44px; height: 44px; border-radius: 50%; background: rgba(6,182,212,0.85); display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 0 20px rgba(6,182,212,0.4); transition: transform 150ms; }
        .wol-video-wrap:hover .wol-play-btn { transform: scale(1.1); }
        .wol-video-badge { position: absolute; top: 10px; left: 10px; background: rgba(8,10,15,0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; padding: 3px 8px; font-size: 0.68rem; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(8px); }

        /* ── Carousel arrows ── */
        .wol-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; width: 38px; height: 38px; border-radius: 50%; background: #0d1117; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 150ms; }
        .wol-arrow:hover { background: rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.3); color: #06b6d4; }
        .wol-arrow:disabled { opacity: 0.3; cursor: default; }
        .wol-arrow.left { left: 0; }
        .wol-arrow.right { right: 0; }

        /* ── Layout selector ── */
        .wol-layout-scroll { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
        .wol-layout-scroll::-webkit-scrollbar { display: none; }
        .wol-layout-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07);
          background: #0d1117; color: #64748b; font-size: 0.8rem; font-weight: 500;
          cursor: pointer; transition: all 150ms; white-space: nowrap; font-family: 'DM Sans', sans-serif;
        }
        .wol-layout-btn:hover { color: #f1f5f9; border-color: rgba(255,255,255,0.15); }
        .wol-layout-btn.active { background: rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.3); color: #06b6d4; }

        /* ── Filter pills ── */
        .wol-filter-btn { padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 500; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: #64748b; cursor: pointer; transition: all 150ms; font-family: 'DM Sans', sans-serif; }
        .wol-filter-btn:hover { color: #f1f5f9; border-color: rgba(255,255,255,0.15); }
        .wol-filter-btn.active { background: rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.3); color: #06b6d4; }

        /* ── Search ── */
        .wol-search { background: #0d1117; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #f1f5f9; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; padding: 7px 14px 7px 36px; outline: none; transition: border-color 150ms; width: 200px; }
        .wol-search:focus { border-color: rgba(6,182,212,0.4); }
        .wol-search::placeholder { color: #475569; }

        /* ── Marquee animation ── */
        @keyframes wol-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes wol-marquee-rev { from { transform: translateX(-50%); } to { transform: translateX(0); } }

        /* ── Utility ── */
        @keyframes wol-fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wol-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="wol-page">
        {/* ── Top Bar ── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,10,15,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={13} fill="black" style={{ color: 'black' }} />
                </div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#f1f5f9', fontSize: '1rem' }}>TestiQra</span>
              </div>
              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
              {spaceInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {spaceInfo.logo && <img src={spaceInfo.logo} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />}
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>{spaceInfo.space_name || spacename}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setShowEmbed(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: '0.825rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 150ms' }}>
                <ExternalLink size={13} /> Embed
              </button>
              <button onClick={() => navigate(`/space/${spacename}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', fontSize: '0.825rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                ← Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem 2rem', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(6,182,212,0.1) 0%, transparent 70%)' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#06b6d4', marginBottom: 12 }}>Wall of Love</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.75rem)', color: '#f1f5f9', marginBottom: 8 }}>
            {spaceInfo?.space_name || spacename}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 20 }}>
            {spaceInfo?.description || 'Real words from real customers'}
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '8px 20px', fontSize: '0.825rem' }}>
            <span style={{ color: '#94a3b8' }}>
              <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{stats.total}</span> testimonials
            </span>
            <span style={{ color: '#334155' }}>·</span>
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={12} fill="#fbbf24" style={{ color: '#fbbf24' }} />
              <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{stats.avg}</span> avg rating
            </span>
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,10,15,0.6)', padding: '0.9rem 1.5rem' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Layout switcher */}
            <div className="wol-layout-scroll">
              {LAYOUTS.map(l => (
                <button key={l.id} className={`wol-layout-btn ${layout === l.id ? 'active' : ''}`} onClick={() => setLayout(l.id)} title={l.desc}>
                  {l.icon} {l.label}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[['all','All'],['text','Text'],['video','Video'],['liked','❤️ Liked']].map(([f, label]) => (
                  <button key={f} className={`wol-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{label}</button>
                ))}
              </div>

              {/* Min rating */}
              <select value={minRating} onChange={e => setMinRating(+e.target.value)}
                style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#94a3b8', fontSize: '0.8rem', padding: '6px 10px', outline: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {[0,1,2,3,4,5].map(r => <option key={r} value={r}>{r === 0 ? 'Any ★' : `${r}+ ★`}</option>)}
              </select>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input className="wol-search" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.75rem 1.5rem 4rem' }}>
          {renderLayout()}
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#334155', fontSize: '0.78rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          Powered by <span style={{ color: '#06b6d4', fontWeight: 700 }}>TestiQra</span>
        </div>
      </div>

      {showEmbed && <EmbedPanel spacename={spacename} layout={layout} onClose={() => setShowEmbed(false)} />}
    </>
  );
}