import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Star, Heart, Copy, Check, X, Search,
  Sparkles, ChevronLeft, ChevronRight, Zap, ExternalLink,
  Play, Quote, TrendingUp, Film, ChevronDown,
  Share2, LayoutTemplate
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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

const Avatar = ({ name = '', photo, size = 32 }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const palette = ['#7c3aed','#0891b2','#059669','#d97706','#db2777','#dc2626'];
  const bg = palette[(name.charCodeAt(0) || 0) % palette.length];
  if (photo) return (
    <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.08)', flexShrink: 0 }} />
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
const VideoCard = ({ t }) => {
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);
  const toggle = () => {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); setPlaying(false); }
    else { ref.current.play(); setPlaying(true); }
  };
  return (
    <div className="wol-card">
      <div className="wol-video-wrap" onClick={toggle}>
        <video ref={ref} src={t.videoUrl || t.VideoURL}
          style={{ width: '100%', display: 'block', borderRadius: '12px 12px 0 0', height: 160, objectFit: 'cover' }}
          onEnded={() => setPlaying(false)} />
        {!playing && (
          <div className="wol-play-overlay">
            <div className="wol-play-btn"><Play size={16} fill="currentColor" /></div>
          </div>
        )}
        <span className="wol-video-badge"><Film size={9} /> Video</span>
      </div>
      <div className="wol-card-body">
        <Stars rating={t.Rating || t.rating} />
        {(t.Content || t.text) && (
          <p className="wol-text">"{(t.Content || t.text).slice(0, 150)}{(t.Content || t.text).length > 150 ? '…' : ''}"</p>
        )}
        <div className="wol-author">
          <Avatar name={t.username || t.name} photo={t.UserImageURL || t.photo} />
          <div>
            <p className="wol-author-name">{t.username || t.name}</p>
            {t.email && <p className="wol-author-meta">{t.email}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Text Card ────────────────────────────────────────────────────────────────
const TextCard = ({ t, featured = false }) => (
  <div className={`wol-card ${featured ? 'featured' : ''}`}>
    <div className="wol-card-body">
      <div className="wol-card-top">
        <Stars rating={t.Rating || t.rating} />
        {featured && <span className="wol-featured-badge">✦ Featured</span>}
      </div>
      <p className="wol-text">"{(t.Content || t.text || '').slice(0, 200)}{(t.Content || t.text || '').length > 200 ? '…' : ''}"</p>
      {(t.imageURL || t.image) && (
        <img src={t.imageURL || t.image} alt="" className="wol-inline-img" />
      )}
      <div className="wol-author">
        <Avatar name={t.username || t.name} photo={t.UserImageURL || t.photo} />
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

const Card = ({ t, index }) => {
  if (t.videoUrl || t.VideoURL) return <VideoCard t={t} />;
  return <TextCard t={t} featured={index === 0} />;
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 1 — Marquee
// ════════════════════════════════════════════════════════════════════
const MarqueeRow = ({ items, reverse = false, speed = 40 }) => {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
      <div style={{
        display: 'flex', gap: 14, width: 'max-content',
        animation: `wol-marquee${reverse ? '-rev' : ''} ${speed}s linear infinite`,
      }}>
        {doubled.map((t, i) => (
          <div key={i} style={{ width: 280, flexShrink: 0 }}>
            <Card t={t} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
};

const MarqueeLayout = ({ items }) => {
  const half = Math.ceil(items.length / 2);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
      <MarqueeRow items={items.slice(0, half).length ? items.slice(0, half) : items} speed={45} />
      <MarqueeRow items={items.slice(half).length ? items.slice(half) : items} reverse speed={38} />
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 2 — Spotlight
// ════════════════════════════════════════════════════════════════════
const SpotlightLayout = ({ items }) => {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = (idx) => {
    setFading(true);
    setTimeout(() => { setActive(idx); setFading(false); }, 280);
  };

  useEffect(() => {
    const t = setInterval(() => goTo((active + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [active, items.length]);

  const t = items[active];
  if (!t) return null;
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
      <div className="wol-card featured" style={{
        padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden',
        opacity: fading ? 0 : 1, transform: fading ? 'translateY(6px)' : 'translateY(0)',
        transition: 'opacity 280ms ease, transform 280ms ease'
      }}>
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', fontSize: 100, lineHeight: 1, color: 'rgba(6,182,212,0.05)', fontFamily: 'Georgia, serif', userSelect: 'none' }}>"</div>
        <Stars rating={t.Rating || t.rating} />
        <p className="wol-text" style={{ fontSize: '1.15rem', lineHeight: 1.75, margin: '1.25rem 0', color: '#e2e8f0' }}>
          "{(t.Content || t.text || '').slice(0, 300)}{(t.Content || t.text || '').length > 300 ? '…' : ''}"
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Avatar name={t.username || t.name} photo={t.UserImageURL || t.photo} size={40} />
          <div style={{ textAlign: 'left' }}>
            <p className="wol-author-name">{t.username || t.name}</p>
            {t.email && <p className="wol-author-meta">{t.email}</p>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18 }}>
        <button onClick={() => goTo((active - 1 + items.length) % items.length)} className="wol-arrow-sm">
          <ChevronLeft size={14} />
        </button>
        <div style={{ display: 'flex', gap: 5 }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              style={{ width: i === active ? 18 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', transition: 'all 250ms', background: i === active ? '#06b6d4' : '#334155' }} />
          ))}
        </div>
        <button onClick={() => goTo((active + 1) % items.length)} className="wol-arrow-sm">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 3 — Cascade (masonry)
// ════════════════════════════════════════════════════════════════════
const CascadeLayout = ({ items }) => {
  const cols = [[], [], []];
  items.forEach((t, i) => cols[i % 3].push({ t, i }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {col.map(({ t, i }) => <Card key={t.id || i} t={t} index={i} />)}
        </div>
      ))}
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

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '1.75rem', maxWidth: 520, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Share2 size={13} style={{ color: '#06b6d4' }} />
            </div>
            <h3 style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Embed Your Wall</h3>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={14} />
          </button>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Paste this into your website to embed your Wall of Love.
        </p>
        <div style={{ background: '#080a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
          <code style={{ fontFamily: 'monospace', fontSize: '0.73rem', color: '#94a3b8', display: 'block', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
            {iframeCode}
          </code>
          <button
            onClick={() => copy(iframeCode, 'iframe')}
            style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: copied === 'iframe' ? 'rgba(16,185,129,0.1)' : 'rgba(6,182,212,0.1)', border: `1px solid ${copied === 'iframe' ? 'rgba(16,185,129,0.3)' : 'rgba(6,182,212,0.2)'}`, borderRadius: 8, color: copied === 'iframe' ? '#10b981' : '#06b6d4', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
          >
            {copied === 'iframe' ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy iFrame</>}
          </button>
        </div>
        <a
          href={`/testimonialwall/${spacename}?layout=${layout}`}
          target="_blank" rel="noreferrer"
          style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: '0.8rem', textDecoration: 'none' }}
        >
          <ExternalLink size={12} /> Open wall in new tab
        </a>
      </div>
    </div>
  );
};

// ─── Layout config ────────────────────────────────────────────────────────────
const LAYOUTS = [
  { id: 'marquee',   label: 'Marquee',  icon: <TrendingUp size={13} />, desc: 'Two rows of auto-scrolling cards' },
  { id: 'spotlight', label: 'Spotlight', icon: <Sparkles size={13} />,  desc: 'One at a time, rotating focus' },
  { id: 'cascade',   label: 'Cascade',  icon: <Zap size={13} />,        desc: 'Pinterest-style masonry grid' },
];

// ─── Layout Dropdown ──────────────────────────────────────────────────────────
const LayoutDropdown = ({ layout, setLayout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = LAYOUTS.find(l => l.id === layout) || LAYOUTS[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} className="wol-dropdown-trigger">
        <LayoutTemplate size={13} style={{ color: '#06b6d4', flexShrink: 0 }} />
        <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{active.label}</span>
        <span style={{ color: '#475569', fontSize: '0.75rem' }}>— {active.desc}</span>
        <ChevronDown size={13} style={{ marginLeft: 'auto', color: '#475569', transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
      </button>

      {open && (
        <div className="wol-dropdown-menu">
          {LAYOUTS.map(l => (
            <button key={l.id}
              onClick={() => { setLayout(l.id); setOpen(false); }}
              className={`wol-dropdown-item ${layout === l.id ? 'active' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span className={`wol-dropdown-icon ${layout === l.id ? 'active' : ''}`}>{l.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: layout === l.id ? '#06b6d4' : '#f1f5f9' }}>{l.label}</span>
                {layout === l.id && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#06b6d4', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 999, padding: '1px 7px', fontWeight: 700 }}>Active</span>}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, paddingLeft: 26 }}>{l.desc}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WallOfLove() {
  const { spacename } = useParams();
  const navigate = useNavigate();

  const [testimonials, setTestimonials] = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [layout, setLayout]             = useState('marquee');
  const [filter, setFilter]             = useState('all');
  const [search, setSearch]             = useState('');
  const [minRating, setMinRating]       = useState(0);
  const [showEmbed, setShowEmbed]       = useState(false);
  const [spaceInfo, setSpaceInfo]       = useState(null);
  const [stats, setStats]               = useState({ total: 0, avg: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${BACKEND_URL}/api/v1/fetchtestimonials`, { params: { spacename }, headers })
        .catch(() => ({ data: { testimonials: [] } })),
      axios.get(`${BACKEND_URL}/api/v1/spaceinfo`, { params: { spacename }, headers })
        .catch(() => ({ data: null })),
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
    if (filter === 'video')  list = list.filter(t => t.videoUrl || t.VideoURL);
    if (filter === 'text')   list = list.filter(t => !t.videoUrl && !t.VideoURL);
    if (filter === 'liked')  list = list.filter(t => t.liked);
    if (minRating > 0)       list = list.filter(t => (t.Rating || 0) >= minRating);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => [t.username, t.name, t.Content, t.text, t.email].join(' ').toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [testimonials, filter, minRating, search]);

  const renderLayout = () => {
    if (loading) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', animation: 'wol-spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading testimonials…</p>
      </div>
    );
    if (!filtered.length) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 10 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={22} style={{ color: '#334155' }} />
        </div>
        <p style={{ color: '#475569', fontWeight: 500 }}>No testimonials found</p>
        <p style={{ color: '#334155', fontSize: '0.875rem' }}>Try adjusting your filters</p>
      </div>
    );
    switch (layout) {
      case 'spotlight': return <SpotlightLayout items={filtered} />;
      case 'cascade':   return <CascadeLayout   items={filtered} />;
      default:          return <MarqueeLayout    items={filtered} />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .wol-page {
          min-height: 100vh;
          background: #080a0f;
          color: #f1f5f9;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Cards — fixed width, no height stretching ── */
        .wol-card {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 200ms, transform 200ms, box-shadow 200ms;
          /* IMPORTANT: width is set by the layout container, not the card */
          break-inside: avoid;
        }
        .wol-card:hover {
          border-color: rgba(6,182,212,0.2);
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.4);
        }
        .wol-card.featured {
          border-color: rgba(6,182,212,0.18);
          background: linear-gradient(145deg, #0d1520 0%, #0d1117 100%);
        }
        .wol-card-body { padding: 1rem; }
        .wol-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
        .wol-text {
          color: #cbd5e1;
          font-size: 0.85rem;
          line-height: 1.65;
          margin: 8px 0;
          /* No clamping — but text is pre-truncated in JS */
          word-break: break-word;
        }
        .wol-author {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .wol-author-name { font-size: 0.82rem; font-weight: 600; color: #f1f5f9; }
        .wol-author-meta { font-size: 0.72rem; color: #64748b; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
        .wol-date { font-size: 0.68rem; color: #475569; margin-top: 2px; }
        .wol-featured-badge {
          font-size: 0.65rem; font-weight: 700; color: #06b6d4;
          background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.2);
          border-radius: 999px; padding: 2px 7px; white-space: nowrap;
        }
        .wol-inline-img {
          width: 100%; border-radius: 8px; margin-top: 8px;
          height: 120px; object-fit: cover;
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* ── Video ── */
        .wol-video-wrap { position: relative; cursor: pointer; }
        .wol-play-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.3); border-radius: 12px 12px 0 0;
          transition: background 150ms;
        }
        .wol-video-wrap:hover .wol-play-overlay { background: rgba(0,0,0,0.5); }
        .wol-play-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(6,182,212,0.85);
          display: flex; align-items: center; justify-content: center;
          color: #fff; box-shadow: 0 0 16px rgba(6,182,212,0.4);
          transition: transform 150ms;
        }
        .wol-video-wrap:hover .wol-play-btn { transform: scale(1.08); }
        .wol-video-badge {
          position: absolute; top: 8px; left: 8px;
          background: rgba(8,10,15,0.85); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px; padding: 2px 7px;
          font-size: 0.65rem; color: #94a3b8; font-weight: 600;
          display: flex; align-items: center; gap: 3px;
          backdrop-filter: blur(8px);
        }

        /* ── Arrow buttons ── */
        .wol-arrow-sm {
          width: 30px; height: 30px; border-radius: 50%;
          background: #0d1117; border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 150ms;
        }
        .wol-arrow-sm:hover { background: rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.3); color: #06b6d4; }

        /* ── Dropdown ── */
        .wol-dropdown-trigger {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 13px; min-width: 300px;
          border-radius: 11px; border: 1px solid rgba(255,255,255,0.1);
          background: #0d1117; color: #94a3b8; font-size: 0.82rem;
          cursor: pointer; transition: all 150ms; font-family: 'DM Sans', sans-serif;
          white-space: nowrap; overflow: hidden;
        }
        .wol-dropdown-trigger:hover { border-color: rgba(6,182,212,0.3); }
        .wol-dropdown-menu {
          position: absolute; top: calc(100% + 5px); left: 0; min-width: 320px; z-index: 60;
          background: #0d1117; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 13px; box-shadow: 0 16px 48px rgba(0,0,0,0.8);
          overflow: hidden;
        }
        .wol-dropdown-item {
          width: 100%; padding: 11px 14px; border: none;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: transparent; text-align: left; cursor: pointer;
          transition: background 150ms; font-family: 'DM Sans', sans-serif;
        }
        .wol-dropdown-item:last-child { border-bottom: none; }
        .wol-dropdown-item:hover { background: rgba(255,255,255,0.03); }
        .wol-dropdown-item.active { background: rgba(6,182,212,0.05); }
        .wol-dropdown-icon {
          width: 20px; height: 20px; border-radius: 5px;
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          color: #64748b; flex-shrink: 0;
        }
        .wol-dropdown-icon.active { background: rgba(6,182,212,0.1); color: #06b6d4; }

        /* ── Filter pills ── */
        .wol-filter-btn {
          padding: 5px 11px; border-radius: 999px; font-size: 0.78rem; font-weight: 500;
          border: 1px solid rgba(255,255,255,0.08); background: transparent; color: #64748b;
          cursor: pointer; transition: all 150ms; font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .wol-filter-btn:hover { color: #f1f5f9; border-color: rgba(255,255,255,0.15); }
        .wol-filter-btn.active { background: rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.3); color: #06b6d4; }

        /* ── Search ── */
        .wol-search {
          background: #0d1117; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; color: #f1f5f9; font-family: 'DM Sans', sans-serif;
          font-size: 0.83rem; padding: 6px 13px 6px 34px; outline: none;
          transition: border-color 150ms; width: 180px;
        }
        .wol-search:focus { border-color: rgba(6,182,212,0.4); }
        .wol-search::placeholder { color: #475569; }

        /* ── Cascade columns — equal-width, no page-width blowout ── */
        .wol-cascade-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          align-items: start;  /* prevents columns from stretching to same height */
        }
        .wol-cascade-col {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* ── Marquee ── */
        @keyframes wol-marquee     { from { transform: translateX(0);    } to { transform: translateX(-50%); } }
        @keyframes wol-marquee-rev { from { transform: translateX(-50%); } to { transform: translateX(0);    } }

        /* ── Utils ── */
        @keyframes wol-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="wol-page">
        {/* ── Top Bar ── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,10,15,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={12} fill="black" style={{ color: 'black' }} />
                </div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#f1f5f9', fontSize: '0.95rem' }}>TestiQra</span>
              </div>
              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />
              {spaceInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {spaceInfo.logo && <img src={spaceInfo.logo} alt="" style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />}
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>{spaceInfo.space_name || spacename}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <button
                onClick={() => setShowEmbed(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, transition: 'all 150ms' }}
              >
                <Share2 size={12} /> Embed
              </button>
              <button
                onClick={() => navigate(`/space/${spacename}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem 1.75rem', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 70%)' }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#06b6d4', marginBottom: 10 }}>Wall of Love</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#f1f5f9', marginBottom: 7 }}>
            {spaceInfo?.space_name || spacename}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 18 }}>Real words from real customers</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '7px 18px', fontSize: '0.8rem' }}>
            <span style={{ color: '#94a3b8' }}>
              <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{stats.total}</span> testimonials
            </span>
            <span style={{ color: '#334155' }}>·</span>
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star size={11} fill="#fbbf24" style={{ color: '#fbbf24' }} />
              <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{stats.avg}</span> avg
            </span>
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,10,15,0.5)', padding: '0.85rem 1.5rem' }}>
          <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <LayoutDropdown layout={layout} setLayout={setLayout} />

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[['all','All'],['text','Text'],['video','Video'],['liked','❤️']].map(([f, label]) => (
                  <button key={f} className={`wol-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{label}</button>
                ))}
              </div>
              <select
                value={minRating}
                onChange={e => setMinRating(+e.target.value)}
                style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#94a3b8', fontSize: '0.78rem', padding: '5px 9px', outline: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                {[0,1,2,3,4,5].map(r => <option key={r} value={r}>{r === 0 ? 'Any ★' : `${r}+ ★`}</option>)}
              </select>
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                <input className="wol-search" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Content — full width, no sidebar ── */}
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
          {renderLayout()}
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', padding: '1.25rem', color: '#334155', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          Powered by <span style={{ color: '#06b6d4', fontWeight: 700 }}>TestiQra</span>
        </div>
      </div>

      {showEmbed && <EmbedPanel spacename={spacename} layout={layout} onClose={() => setShowEmbed(false)} />}
    </>
  );
}