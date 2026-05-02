import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Star, Heart, Copy, Check, X, Search,
  Sparkles, ChevronLeft, ChevronRight, Zap, ExternalLink,
  Play, Pause, Quote, TrendingUp, Film, ChevronDown,
  Eye, Code2, LayoutTemplate, Share2
} from 'lucide-react';

// ── Use env var with fallback for local dev ──────────────────────────────────
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

const Card = ({ t, variant, index }) => {
  if (t.videoUrl || t.VideoURL) return <VideoCard t={t} variant={variant} />;
  return <TextCard t={t} variant={variant} featured={index === 0} />;
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 1 — Marquee (two auto-scrolling rows)
// ════════════════════════════════════════════════════════════════════
const MarqueeRow = ({ items, reverse = false, speed = 35 }) => {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
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
// LAYOUT 2 — Spotlight (big quote rotator with fade transition)
// ════════════════════════════════════════════════════════════════════
const SpotlightLayout = ({ items }) => {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = (idx) => {
    setFading(true);
    setTimeout(() => { setActive(idx); setFading(false); }, 300);
  };

  useEffect(() => {
    const t = setInterval(() => goTo((active + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [active, items.length]);

  const t = items[active];
  if (!t) return null;
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
      <div className="wol-card featured" style={{
        padding: '3rem 2.5rem', position: 'relative', overflow: 'hidden',
        opacity: fading ? 0 : 1, transform: fading ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 300ms ease, transform 300ms ease'
      }}>
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
      {/* Prev / Next */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
        <button onClick={() => goTo((active - 1 + items.length) % items.length)} className="wol-arrow-sm">
          <ChevronLeft size={15} />
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              style={{ width: i === active ? 20 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', transition: 'all 250ms', background: i === active ? '#06b6d4' : '#334155' }} />
          ))}
        </div>
        <button onClick={() => goTo((active + 1) % items.length)} className="wol-arrow-sm">
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// LAYOUT 3 — Cascade (staggered masonry with entrance animation)
// ════════════════════════════════════════════════════════════════════
const CascadeLayout = ({ items }) => {
  const cols = [[], [], []];
  items.forEach((t, i) => cols[i % 3].push({ t, i }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {col.map(({ t, i }) => (
            <div key={t.id || i} style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
              <Card t={t} variant="cascade" index={i} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ─── Embed Panel (modal) ──────────────────────────────────────────────────────
const EmbedPanel = ({ spacename, layout, onClose }) => {
  const [copied, setCopied] = useState('');
  const origin = window.location.origin;
  const iframeCode = `<iframe src="${origin}/testimonialwall/${spacename}?layout=${layout}" width="100%" height="600" frameborder="0" style="border-radius:16px;border:none;"></iframe>`;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '1.75rem', maxWidth: 540, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.8)', animation: 'wol-fadeUp 0.2s ease' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Share2 size={13} style={{ color: '#06b6d4' }} />
            </div>
            <h3 style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Embed Your Wall</h3>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Paste this into your website to embed your Wall of Love.
        </p>
        {/* iFrame snippet */}
        <div style={{ background: '#080a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
          <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', display: 'block', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
            {iframeCode}
          </code>
          <button
            onClick={() => copy(iframeCode, 'iframe')}
            style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: copied === 'iframe' ? 'rgba(16,185,129,0.1)' : 'rgba(6,182,212,0.1)', border: `1px solid ${copied === 'iframe' ? 'rgba(16,185,129,0.3)' : 'rgba(6,182,212,0.2)'}`, borderRadius: 8, color: copied === 'iframe' ? '#10b981' : '#06b6d4', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 200ms', fontFamily: 'DM Sans, sans-serif' }}
          >
            {copied === 'iframe' ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy iFrame</>}
          </button>
        </div>
        {/* Live preview link */}
        <a
          href={`/testimonialwall/${spacename}?layout=${layout}`}
          target="_blank"
          rel="noreferrer"
          style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: '0.8rem', textDecoration: 'none' }}
        >
          <ExternalLink size={12} />
          Open wall in new tab
        </a>
      </div>
    </div>
  );
};

// ─── Layout Config (3 animated options) ──────────────────────────────────────
const LAYOUTS = [
  {
    id: 'marquee',
    label: 'Marquee',
    icon: <TrendingUp size={14} />,
    desc: 'Two rows of cards that auto-scroll in opposite directions — great for displaying many testimonials at once.',
    preview: '↔ Continuous horizontal scroll',
  },
  {
    id: 'spotlight',
    label: 'Spotlight',
    icon: <Sparkles size={14} />,
    desc: 'One testimonial at a time, large and centered. Auto-rotates with a smooth fade every 5 seconds.',
    preview: '⟳ Rotating single focus',
  },
  {
    id: 'cascade',
    label: 'Cascade',
    icon: <Zap size={14} />,
    desc: 'Pinterest-style masonry grid with staggered entrance animations. Cards cascade in one by one.',
    preview: '⬇ Staggered card entrance',
  },
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
        <LayoutTemplate size={13} style={{ color: '#06b6d4' }} />
        <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{active.label}</span>
        <span style={{ color: '#475569', fontSize: '0.75rem', marginLeft: 2 }}>— {active.preview}</span>
        <ChevronDown size={13} style={{ marginLeft: 'auto', color: '#475569', transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div className="wol-dropdown-menu">
          <p style={{ padding: '10px 14px 6px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', fontWeight: 700 }}>Choose a display style</p>
          {LAYOUTS.map(l => (
            <button key={l.id}
              onClick={() => { setLayout(l.id); setOpen(false); }}
              className={`wol-dropdown-item ${layout === l.id ? 'active' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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

// ─── Code Preview Panel (right sidebar) ──────────────────────────────────────
const CodePreviewPanel = ({ spacename, layout, onShareClick }) => {
  const [tab, setTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const origin = window.location.origin;

  const iframeCode = `<iframe\n  src="${origin}/testimonialwall/${spacename}?layout=${layout}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border-radius:16px;border:none;"\n></iframe>`;

  const scriptCode = `<!-- TestiQra Wall of Love -->\n<div id="testiqra-wall"></div>\n<script>\n  window.TestiQra = {\n    spacename: "${spacename}",\n    layout: "${layout}",\n    container: "#testiqra-wall"\n  };\n<\/script>\n<script src="${origin}/embed.js" async><\/script>`;

  const activeCode = tab === 'iframe' ? iframeCode : scriptCode;

  const copyCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS = [
    ['preview', <Eye size={12} />, 'Preview'],
    ['iframe',  <Code2 size={12} />, 'iFrame'],
    ['script',  <Zap size={12} />, 'Script'],
  ];

  return (
    <div className="wol-preview-panel">
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Code2 size={13} style={{ color: '#06b6d4' }} />
          </div>
          <div>
            <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>Embed Code</p>
            <p style={{ color: '#475569', fontSize: '0.72rem', margin: 0 }}>Paste into your website</p>
          </div>
        </div>
        {/* Share / open modal button */}
        <button
          onClick={onShareClick}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
          title="Open full embed dialog"
        >
          <Share2 size={11} /> Share
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4 }}>
        {TABS.map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '6px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', fontWeight: 500,
              background: tab === id ? '#0d1117' : 'transparent',
              color: tab === id ? '#f1f5f9' : '#475569',
              boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
              transition: 'all 150ms',
            }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Preview tab ── */}
      {tab === 'preview' && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            How your wall looks when embedded on a white-background site:
          </p>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#fff' }}>
            {/* Browser chrome mockup */}
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ff5f57','#ffbd2e','#28c840'].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0', padding: '3px 10px', fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                yoursite.com/landing-page
              </div>
              <a
                href={`/testimonialwall/${spacename}?layout=${layout}`}
                target="_blank" rel="noreferrer"
                style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                title="Open live wall"
              >
                <ExternalLink size={10} />
              </a>
            </div>

            {/* Fake white page content */}
            <div style={{ background: '#ffffff', padding: '24px 20px' }}>
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <div style={{ height: 14, background: '#f1f5f9', borderRadius: 4, marginBottom: 8, width: '65%' }} />
                <div style={{ height: 10, background: '#f1f5f9', borderRadius: 4, marginBottom: 6, width: '90%' }} />
                <div style={{ height: 10, background: '#f1f5f9', borderRadius: 4, marginBottom: 20, width: '75%' }} />

                {/* Embedded wall placeholder */}
                <div style={{ borderRadius: 12, border: '2px dashed rgba(6,182,212,0.4)', background: 'rgba(6,182,212,0.04)', padding: '20px', textAlign: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -10, left: 12, background: '#06b6d4', borderRadius: 4, padding: '1px 8px', fontSize: '0.65rem', color: '#000', fontWeight: 700, fontFamily: 'monospace' }}>iframe</div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <Zap size={16} style={{ color: '#06b6d4' }} />
                  </div>
                  <p style={{ color: '#0891b2', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>
                    Wall of Love — {layout.charAt(0).toUpperCase() + layout.slice(1)} Layout
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 4, marginBottom: 12 }}>
                    Powered by TestiQra
                  </p>
                  {/* Mini fake cards */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                    {[72, 56, 64, 80, 52].map((w, i) => (
                      <div key={i} style={{ width: w, height: 40, background: '#f1f5f9', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    ))}
                  </div>
                </div>

                <div style={{ height: 10, background: '#f1f5f9', borderRadius: 4, marginTop: 20, width: '80%' }} />
                <div style={{ height: 10, background: '#f1f5f9', borderRadius: 4, marginTop: 6, width: '60%' }} />
              </div>
            </div>
          </div>
          <p style={{ color: '#334155', fontSize: '0.72rem', marginTop: 8, textAlign: 'center' }}>
            Your wall blends seamlessly into any white-background website
          </p>
        </div>
      )}

      {/* ── iFrame / Script tabs ── */}
      {(tab === 'iframe' || tab === 'script') && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            {tab === 'iframe'
              ? 'Paste anywhere in your HTML body:'
              : 'Add before your closing </body> tag:'}
          </p>
          <div style={{ background: '#080a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, position: 'relative' }}>
            {/* Line numbers + syntax */}
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
              <div style={{ color: '#334155', fontSize: '0.7rem', fontFamily: 'monospace', lineHeight: 1.8, userSelect: 'none', textAlign: 'right', minWidth: 16 }}>
                {activeCode.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', display: 'block', whiteSpace: 'pre', flex: 1, lineHeight: 1.8 }}>
                {activeCode.split('\n').map((line, i) => (
                  <div key={i} style={{
                    color: line.trim().startsWith('<') || line.trim().startsWith('>')
                      ? '#7dd3fc'
                      : line.trim().startsWith('//')
                      ? '#475569'
                      : line.includes('"') || line.includes("'")
                      ? '#94a3b8'
                      : '#c4b5fd',
                  }}>
                    {line || ' '}
                  </div>
                ))}
              </code>
            </div>

            <button
              onClick={copyCode}
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(6,182,212,0.1)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(6,182,212,0.2)'}`, borderRadius: 8, color: copied ? '#10b981' : '#06b6d4', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 200ms', fontFamily: 'DM Sans, sans-serif' }}
            >
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Code</>}
            </button>
          </div>
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
  const [showEmbed, setShowEmbed]       = useState(false);   // ← now wired up
  const [spaceInfo, setSpaceInfo]       = useState(null);
  const [stats, setStats]               = useState({ total: 0, avg: 0 });

  // ── Fetch testimonials + space info ────────────────────────────────────────
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
      const avg = list.length
        ? (list.reduce((s, t) => s + (t.Rating || 0), 0) / list.length).toFixed(1)
        : 0;
      setStats({ total: list.length, avg });
      setLoading(false);
    });
  }, [spacename]);

  // ── Client-side filtering ──────────────────────────────────────────────────
  useEffect(() => {
    let list = [...testimonials];
    if (filter === 'video')  list = list.filter(t => t.videoUrl || t.VideoURL);
    if (filter === 'text')   list = list.filter(t => !t.videoUrl && !t.VideoURL);
    if (filter === 'liked')  list = list.filter(t => t.liked);
    if (minRating > 0)       list = list.filter(t => (t.Rating || 0) >= minRating);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        [t.username, t.name, t.Content, t.text, t.email].join(' ').toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [testimonials, filter, minRating, search]);

  // ── Render active layout ───────────────────────────────────────────────────
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
      case 'spotlight': return <SpotlightLayout items={filtered} />;
      case 'cascade':   return <CascadeLayout   items={filtered} />;
      default:          return <MarqueeLayout    items={filtered} />;
    }
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
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

        /* ── Two-column wrapper ── */
        .wol-main-grid {
          max-width: 1500px;
          margin: 0 auto;
          padding: 1.75rem 1.5rem 4rem;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .wol-main-grid { grid-template-columns: 1fr; }
          .wol-preview-panel { order: -1; }
        }

        /* ── Cards ── */
        .wol-card {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 250ms, transform 250ms, box-shadow 250ms;
          animation: wol-fadeUp 0.5s ease both;
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
        .wol-card.featured:hover {
          border-color: rgba(6,182,212,0.4);
          box-shadow: 0 0 32px rgba(6,182,212,0.08);
        }
        .wol-card.cascade { animation: wol-cascadeIn 0.5s ease both; }
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

        /* ── Arrow buttons ── */
        .wol-arrow-sm { width: 32px; height: 32px; border-radius: 50%; background: #0d1117; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 150ms; }
        .wol-arrow-sm:hover { background: rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.3); color: #06b6d4; }

        /* ── Dropdown ── */
        .wol-dropdown-trigger {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; min-width: 340px;
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
          background: #0d1117; color: #94a3b8; font-size: 0.82rem;
          cursor: pointer; transition: all 150ms; font-family: 'DM Sans', sans-serif;
          white-space: nowrap; overflow: hidden;
        }
        .wol-dropdown-trigger:hover { border-color: rgba(6,182,212,0.3); }
        .wol-dropdown-menu {
          position: absolute; top: calc(100% + 6px); left: 0; min-width: 360px; z-index: 60;
          background: #0d1117; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,0.8);
          overflow: hidden; animation: wol-fadeUp 0.15s ease;
        }
        .wol-dropdown-item {
          width: 100%; padding: 12px 14px; border: none; border-bottom: 1px solid rgba(255,255,255,0.05);
          background: transparent; text-align: left; cursor: pointer;
          transition: background 150ms; font-family: 'DM Sans', sans-serif;
        }
        .wol-dropdown-item:last-child { border-bottom: none; }
        .wol-dropdown-item:hover { background: rgba(255,255,255,0.03); }
        .wol-dropdown-item.active { background: rgba(6,182,212,0.05); }
        .wol-dropdown-icon { width: 22px; height: 22px; border-radius: 6px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; }
        .wol-dropdown-icon.active { background: rgba(6,182,212,0.1); color: #06b6d4; }

        /* ── Preview Panel (sidebar) ── */
        .wol-preview-panel {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 1.25rem;
          position: sticky;
          top: 80px;
        }

        /* ── Filter pills ── */
        .wol-filter-btn { padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 500; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: #64748b; cursor: pointer; transition: all 150ms; font-family: 'DM Sans', sans-serif; }
        .wol-filter-btn:hover { color: #f1f5f9; border-color: rgba(255,255,255,0.15); }
        .wol-filter-btn.active { background: rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.3); color: #06b6d4; }

        /* ── Search ── */
        .wol-search { background: #0d1117; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #f1f5f9; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; padding: 7px 14px 7px 36px; outline: none; transition: border-color 150ms; width: 200px; }
        .wol-search:focus { border-color: rgba(6,182,212,0.4); }
        .wol-search::placeholder { color: #475569; }

        /* ── Marquee animations ── */
        @keyframes wol-marquee     { from { transform: translateX(0);    } to { transform: translateX(-50%); } }
        @keyframes wol-marquee-rev { from { transform: translateX(-50%); } to { transform: translateX(0);    } }

        /* ── Utility animations ── */
        @keyframes wol-fadeUp    { from { opacity: 0; transform: translateY(10px);              } to { opacity: 1; transform: translateY(0);          } }
        @keyframes wol-cascadeIn { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes wol-spin      { to   { transform: rotate(360deg); } }

        /* ── Pause marquee on hover ── */
        .wol-marquee-track:hover > div { animation-play-state: paused; }
      `}</style>

      <div className="wol-page">

        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,10,15,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1500, margin: '0 auto', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>

            {/* Brand + space name */}
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
                  {spaceInfo.logo && (
                    <img src={spaceInfo.logo} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                  )}
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>
                    {spaceInfo.space_name || spacename}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* ← Embed button now opens the EmbedPanel modal */}
              <button
                onClick={() => setShowEmbed(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: '0.825rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'; e.currentTarget.style.color = '#06b6d4'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <Share2 size={13} /> Embed
              </button>
              <button
                onClick={() => navigate(`/space/${spacename}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', fontSize: '0.825rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem 2rem', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(6,182,212,0.1) 0%, transparent 70%)' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#06b6d4', marginBottom: 12 }}>Wall of Love</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.75rem)', color: '#f1f5f9', marginBottom: 8 }}>
            {spaceInfo?.space_name || spacename}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 20 }}>
            {spaceInfo?.description || 'Real words from real customers'}
          </p>
          {/* Stats pill */}
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

        {/* ── Controls bar ─────────────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,10,15,0.6)', padding: '0.9rem 1.5rem' }}>
          <div style={{ maxWidth: 1500, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>

            {/* Layout dropdown */}
            <LayoutDropdown layout={layout} setLayout={setLayout} />

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[['all','All'],['text','Text'],['video','Video'],['liked','❤️ Liked']].map(([f, label]) => (
                  <button
                    key={f}
                    className={`wol-filter-btn ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Min rating */}
              <select
                value={minRating}
                onChange={e => setMinRating(+e.target.value)}
                style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#94a3b8', fontSize: '0.8rem', padding: '6px 10px', outline: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                {[0,1,2,3,4,5].map(r => (
                  <option key={r} value={r}>{r === 0 ? 'Any ★' : `${r}+ ★`}</option>
                ))}
              </select>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                <input
                  className="wol-search"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column content + sidebar ─────────────────────────────────── */}
        <div className="wol-main-grid">
          {/* Main layout area */}
          <div>{renderLayout()}</div>

          {/* Sidebar: code preview + share button wired to EmbedPanel */}
          <CodePreviewPanel
            spacename={spacename}
            layout={layout}
            onShareClick={() => setShowEmbed(true)}
          />
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#334155', fontSize: '0.78rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          Powered by <span style={{ color: '#06b6d4', fontWeight: 700 }}>TestiQra</span>
        </div>
      </div>

      {/* ── Embed modal (triggered by Embed button OR sidebar Share button) ── */}
      {showEmbed && (
        <EmbedPanel
          spacename={spacename}
          layout={layout}
          onClose={() => setShowEmbed(false)}
        />
      )}
    </>
  );
}