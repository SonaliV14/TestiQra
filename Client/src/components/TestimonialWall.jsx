import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Star, Heart, Copy, Check, X, Search,
  Sparkles, ChevronLeft, ChevronRight, Zap, ExternalLink,
  Play, Film, ChevronDown, Share2, LayoutTemplate,
  Palette, Sliders, Code2, Settings2, Eye, Monitor,
  Smartphone, Save, RefreshCw, Download, ArrowLeft,
  TrendingUp, Quote, BarChart2
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// ─── Theme Presets ────────────────────────────────────────────────────────────
const THEME_PRESETS = {
  obsidian: {
    name: 'Obsidian',
    pageBg: '#07080c',
    cardBg: '#0e1117',
    cardBorder: 'rgba(255,255,255,0.07)',
    cardHoverBorder: 'rgba(99,179,237,0.25)',
    textPrimary: '#eef2f7',
    textSecondary: '#8896a8',
    textMuted: '#4a5568',
    accent: '#63b3ed',
    accentGlow: 'rgba(99,179,237,0.12)',
    starColor: '#f6ad55',
    featuredBorder: 'rgba(99,179,237,0.2)',
    featuredBg: 'linear-gradient(145deg,#0e1b2b,#0e1117)',
    shadow: '0 4px 24px rgba(0,0,0,0.5)',
  },
  midnight: {
    name: 'Midnight',
    pageBg: '#050507',
    cardBg: '#0c0c14',
    cardBorder: 'rgba(139,92,246,0.12)',
    cardHoverBorder: 'rgba(139,92,246,0.35)',
    textPrimary: '#f0eeff',
    textSecondary: '#9e8ec8',
    textMuted: '#4c4675',
    accent: '#a78bfa',
    accentGlow: 'rgba(139,92,246,0.12)',
    starColor: '#fbbf24',
    featuredBorder: 'rgba(139,92,246,0.25)',
    featuredBg: 'linear-gradient(145deg,#110f20,#0c0c14)',
    shadow: '0 4px 28px rgba(0,0,0,0.6)',
  },
  aurora: {
    name: 'Aurora',
    pageBg: '#030b0a',
    cardBg: '#071211',
    cardBorder: 'rgba(16,185,129,0.1)',
    cardHoverBorder: 'rgba(16,185,129,0.3)',
    textPrimary: '#ecfdf5',
    textSecondary: '#6ee7b7',
    textMuted: '#1e4d3a',
    accent: '#34d399',
    accentGlow: 'rgba(16,185,129,0.1)',
    starColor: '#fcd34d',
    featuredBorder: 'rgba(16,185,129,0.22)',
    featuredBg: 'linear-gradient(145deg,#061a12,#071211)',
    shadow: '0 4px 24px rgba(0,0,0,0.5)',
  },
  noir: {
    name: 'Noir',
    pageBg: '#ffffff',
    cardBg: '#fafafa',
    cardBorder: '#e8e8e8',
    cardHoverBorder: '#111111',
    textPrimary: '#111111',
    textSecondary: '#555555',
    textMuted: '#aaaaaa',
    accent: '#111111',
    accentGlow: 'rgba(0,0,0,0.05)',
    starColor: '#e67e22',
    featuredBorder: '#111111',
    featuredBg: '#f0f0f0',
    shadow: '3px 3px 0px #111111',
  },
  ember: {
    name: 'Ember',
    pageBg: '#0c0602',
    cardBg: '#140d05',
    cardBorder: 'rgba(251,146,60,0.1)',
    cardHoverBorder: 'rgba(251,146,60,0.3)',
    textPrimary: '#fff7ed',
    textSecondary: '#fdba74',
    textMuted: '#431407',
    accent: '#fb923c',
    accentGlow: 'rgba(251,146,60,0.1)',
    starColor: '#fbbf24',
    featuredBorder: 'rgba(251,146,60,0.22)',
    featuredBg: 'linear-gradient(145deg,#1c0e04,#140d05)',
    shadow: '0 4px 24px rgba(0,0,0,0.5)',
  },
};

const LAYOUTS = [
  { id: 'marquee',   label: 'Marquee',   icon: '↔', desc: 'Two rows, auto-scrolling' },
  { id: 'spotlight', label: 'Spotlight', icon: '◎', desc: 'One at a time, rotating' },
  { id: 'cascade',   label: 'Cascade',   icon: '⊞', desc: 'Masonry grid' },
  { id: 'grid',      label: 'Grid',      icon: '▦', desc: 'Clean equal-size grid' },
];

const FONT_OPTIONS = [
  { label: 'DM Sans',          value: "'DM Sans', sans-serif" },
  { label: 'Inter',            value: "'Inter', sans-serif" },
  { label: 'Lora',             value: "'Lora', serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Space Mono',       value: "'Space Mono', monospace" },
  { label: 'Raleway',          value: "'Raleway', sans-serif" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Stars = ({ rating = 5, color = '#f6ad55' }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={11}
        style={{ color: i <= rating ? color : 'rgba(128,128,128,0.25)' }}
        fill={i <= rating ? color : 'none'} />
    ))}
  </div>
);

const Avatar = ({ name = '', photo, size = 32, theme }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const palette = [theme?.accent || '#63b3ed','#7c3aed','#059669','#d97706','#db2777'];
  const bg = palette[(name.charCodeAt(0) || 0) % palette.length];
  if (photo) return (
    <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${theme?.cardBorder || 'rgba(255,255,255,0.1)'}`, flexShrink: 0 }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff',
      border: `1px solid ${theme?.cardBorder || 'rgba(255,255,255,0.1)'}`,
    }}>{initials || '?'}</div>
  );
};

// ─── Cards ────────────────────────────────────────────────────────────────────
const VideoCard = ({ t, theme, cfg }) => {
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);
  const toggle = () => {
    if (!ref.current) return;
    playing ? ref.current.pause() : ref.current.play();
    setPlaying(!playing);
  };
  return (
    <div style={{
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: cfg.borderRadius,
      overflow: 'hidden',
      transition: 'all 220ms ease',
      boxShadow: theme.shadow,
      fontFamily: cfg.fontFamily,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = theme.cardHoverBorder; e.currentTarget.style.transform = 'translateY(-3px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = theme.cardBorder; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={toggle}>
        <video ref={ref} src={t.videoUrl || t.VideoURL}
          style={{ width: '100%', display: 'block', height: 160, objectFit: 'cover' }}
          onEnded={() => setPlaying(false)} />
        {!playing && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', transition: 'background 150ms' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${theme.accentGlow}` }}>
              <Play size={16} fill="white" style={{ color: '#fff' }} />
            </div>
          </div>
        )}
        <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.75)', border: `1px solid ${theme.cardBorder}`, borderRadius: 999, padding: '2px 8px', fontSize: 10, color: theme.textSecondary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, backdropFilter: 'blur(8px)' }}>
          <Film size={8} /> Video
        </span>
      </div>
      <div style={{ padding: '0.875rem' }}>
        <Stars rating={t.Rating || t.rating} color={theme.starColor} />
        {(t.Content || t.text) && (
          <p style={{ color: theme.textSecondary, fontSize: cfg.fontSize, lineHeight: 1.65, margin: '8px 0', wordBreak: 'break-word' }}>
            "{(t.Content || t.text).slice(0, cfg.truncateAt)}{(t.Content || t.text).length > cfg.truncateAt ? '…' : ''}"
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${theme.cardBorder}` }}>
          <Avatar name={t.username || t.name} photo={t.UserImageURL || t.photo} theme={theme} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary, margin: 0 }}>{t.username || t.name}</p>
            {t.email && <p style={{ fontSize: 10, color: theme.textMuted, margin: 0 }}>{t.email}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const TextCard = ({ t, featured = false, theme, cfg }) => (
  <div style={{
    background: featured ? theme.featuredBg : theme.cardBg,
    border: `1px solid ${featured ? theme.featuredBorder : theme.cardBorder}`,
    borderRadius: cfg.borderRadius,
    overflow: 'hidden',
    transition: 'all 220ms ease',
    boxShadow: featured ? `0 0 0 1px ${theme.featuredBorder}, ${theme.shadow}` : theme.shadow,
    fontFamily: cfg.fontFamily,
    position: 'relative',
  }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = theme.cardHoverBorder; e.currentTarget.style.transform = 'translateY(-3px)'; }}
  onMouseLeave={e => { e.currentTarget.style.borderColor = featured ? theme.featuredBorder : theme.cardBorder; e.currentTarget.style.transform = 'translateY(0)'; }}>
    {featured && (
      <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 700, color: theme.accent, background: theme.accentGlow, border: `1px solid ${theme.featuredBorder}`, borderRadius: 999, padding: '2px 8px', letterSpacing: '0.08em' }}>
        ✦ FEATURED
      </div>
    )}
    <div style={{ padding: '1rem' }}>
      <Stars rating={t.Rating || t.rating} color={theme.starColor} />
      <p style={{ color: theme.textSecondary, fontSize: cfg.fontSize, lineHeight: 1.7, margin: '10px 0', wordBreak: 'break-word' }}>
        "{(t.Content || t.text || '').slice(0, cfg.truncateAt)}{(t.Content || t.text || '').length > cfg.truncateAt ? '…' : ''}"
      </p>
      {(t.imageURL || t.image) && (
        <img src={t.imageURL || t.image} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 10, height: 110, objectFit: 'cover', border: `1px solid ${theme.cardBorder}` }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${theme.cardBorder}` }}>
        <Avatar name={t.username || t.name} photo={t.UserImageURL || t.photo} theme={theme} />
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary, margin: 0 }}>{t.username || t.name}</p>
          {t.email && <p style={{ fontSize: 10, color: theme.textMuted, margin: 0 }}>{t.email}</p>}
          <p style={{ fontSize: 10, color: theme.textMuted, margin: 0 }}>
            {new Date(t.submittedAt || t.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  </div>
);

const Card = ({ t, index, theme, cfg }) => {
  if (t.videoUrl || t.VideoURL) return <VideoCard t={t} theme={theme} cfg={cfg} />;
  return <TextCard t={t} featured={index === 0 && cfg.featuredFirst} theme={theme} cfg={cfg} />;
};

// ─── Layouts ──────────────────────────────────────────────────────────────────
const MarqueeRow = ({ items, reverse = false, speed = 42, theme, cfg }) => {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}>
      <div style={{ display: 'flex', gap: 14, width: 'max-content', animation: `wol-marquee${reverse?'-rev':''} ${speed}s linear infinite` }}>
        {doubled.map((t, i) => (
          <div key={i} style={{ width: 286, flexShrink: 0 }}>
            <Card t={t} index={i} theme={theme} cfg={cfg} />
          </div>
        ))}
      </div>
    </div>
  );
};

const MarqueeLayout = ({ items, theme, cfg }) => {
  const half = Math.ceil(items.length / 2);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <MarqueeRow items={items.slice(0, half).length ? items.slice(0, half) : items} speed={44} theme={theme} cfg={cfg} />
      <MarqueeRow items={items.slice(half).length ? items.slice(half) : items} reverse speed={37} theme={theme} cfg={cfg} />
    </div>
  );
};

const SpotlightLayout = ({ items, theme, cfg }) => {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const goTo = (idx) => { setFading(true); setTimeout(() => { setActive(idx); setFading(false); }, 260); };
  useEffect(() => {
    const timer = setInterval(() => goTo((active + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [active, items.length]);
  const t = items[active];
  if (!t) return null;
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        background: theme.featuredBg, border: `1px solid ${theme.featuredBorder}`,
        borderRadius: cfg.borderRadius, padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden',
        opacity: fading ? 0 : 1, transform: fading ? 'translateY(8px) scale(0.99)' : 'translateY(0) scale(1)',
        transition: 'all 260ms cubic-bezier(0.4,0,0.2,1)', boxShadow: theme.shadow,
        fontFamily: cfg.fontFamily,
      }}>
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 120, lineHeight: 1, color: theme.accentGlow, fontFamily: 'Georgia, serif', userSelect: 'none', pointerEvents: 'none' }}>"</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Stars rating={t.Rating || t.rating} color={theme.starColor} />
        </div>
        <p style={{ color: theme.textSecondary, fontSize: cfg.fontSize + 2, lineHeight: 1.8, margin: '0 0 20px', position: 'relative', zIndex: 1 }}>
          "{(t.Content || t.text || '').slice(0, 300)}{(t.Content || t.text || '').length > 300 ? '…' : ''}"
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Avatar name={t.username || t.name} photo={t.UserImageURL || t.photo} size={40} theme={theme} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, margin: 0 }}>{t.username || t.name}</p>
            {t.email && <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>{t.email}</p>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 }}>
        <button onClick={() => goTo((active - 1 + items.length) % items.length)} style={{ width: 32, height: 32, borderRadius: '50%', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}>
          <ChevronLeft size={14} />
        </button>
        <div style={{ display: 'flex', gap: 5 }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width: i === active ? 20 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', transition: 'all 250ms', background: i === active ? theme.accent : theme.cardBorder }} />
          ))}
        </div>
        <button onClick={() => goTo((active + 1) % items.length)} style={{ width: 32, height: 32, borderRadius: '50%', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

const CascadeLayout = ({ items, theme, cfg }) => {
  const cols = [[], [], []];
  items.forEach((t, i) => cols[i % 3].push({ t, i }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, alignItems: 'start' }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {col.map(({ t, i }) => <Card key={t.id || i} t={t} index={i} theme={theme} cfg={cfg} />)}
        </div>
      ))}
    </div>
  );
};

const GridLayout = ({ items, theme, cfg }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cfg.columns || 3}, 1fr)`, gap: 14 }}>
    {items.map((t, i) => <Card key={t.id || i} t={t} index={i} theme={theme} cfg={cfg} />)}
  </div>
);

// ─── Embed Modal ──────────────────────────────────────────────────────────────
const EmbedModal = ({ spacename, layout, cfg, onClose }) => {
  const [tab, setTab] = useState('iframe');
  const [copied, setCopied] = useState('');
  const origin = window.location.origin;
  const cfgParam = encodeURIComponent(JSON.stringify({ ...cfg, theme: undefined }));

  const snippets = {
    iframe: `<iframe\n  src="${origin}/testimonialwall/${spacename}?layout=${layout}&cfg=${cfgParam}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border:none;border-radius:${cfg.borderRadius}px;"\n  loading="lazy"\n></iframe>`,
    script: `<div id="testiqra-wall"></div>\n<script>\n  (function(){\n    var el = document.getElementById('testiqra-wall');\n    var iframe = document.createElement('iframe');\n    iframe.src = "${origin}/testimonialwall/${spacename}?layout=${layout}";\n    iframe.width = "100%"; iframe.height = "600";\n    iframe.frameBorder = "0";\n    iframe.style.borderRadius = "${cfg.borderRadius}px";\n    el.appendChild(iframe);\n  })();\n<\/script>`,
  };

  const copy = (key) => { navigator.clipboard.writeText(snippets[key]); setCopied(key); setTimeout(() => setCopied(''), 2000); };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={14} style={{ color: '#63b3ed' }} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#eef2f7', fontWeight: 600, fontSize: 15 }}>Embed Wall of Love</p>
              <p style={{ margin: 0, color: '#4a5568', fontSize: 11 }}>Copy & paste into your website</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8896a8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 3, padding: '12px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[['iframe','iFrame'],['script','Script']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '6px 14px', borderRadius: '8px 8px 0 0', border: `1px solid ${tab===id?'rgba(255,255,255,0.09)':'transparent'}`, background: tab===id?'#0e1117':'transparent', color: tab===id?'#63b3ed':'#4a5568', cursor: 'pointer', fontSize: 12, fontWeight: 600, borderBottom: tab===id?'1px solid #0e1117':'transparent', marginBottom: -1, fontFamily: 'DM Sans, sans-serif' }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ background: '#07080c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, position: 'relative' }}>
            <pre style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 11.5, color: '#8896a8', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.8 }}>{snippets[tab]}</pre>
            <button onClick={() => copy(tab)} style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: copied===tab?'rgba(16,185,129,0.1)':'rgba(99,179,237,0.1)', border: `1px solid ${copied===tab?'rgba(16,185,129,0.3)':'rgba(99,179,237,0.2)'}`, borderRadius: 8, color: copied===tab?'#10b981':'#63b3ed', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
              {copied===tab ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
            </button>
          </div>
          <a href={`/testimonialwall/${spacename}?layout=${layout}`} target="_blank" rel="noreferrer" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, color: '#4a5568', fontSize: 12, textDecoration: 'none' }}>
            <ExternalLink size={11} /> Open in new tab
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Customizer Panel ─────────────────────────────────────────────────────────
const CustomizerPanel = ({ cfg, setCfg, layout, setLayout, onEmbed, onClose, theme }) => {
  const [activeSection, setActiveSection] = useState('theme');

  const sections = [
    { id: 'theme',  label: 'Theme',  icon: <Palette size={13} /> },
    { id: 'layout', label: 'Layout', icon: <LayoutTemplate size={13} /> },
    { id: 'style',  label: 'Style',  icon: <Sliders size={13} /> },
  ];

  const labelStyle = { color: '#8896a8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 7, fontWeight: 600 };
  const sectionGap = { marginBottom: 20 };

  const sliderRow = (key, label, min, max, unit = '') => (
    <div style={sectionGap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={labelStyle}>{label}</label>
        <span style={{ color: theme.accent, fontSize: 11, fontWeight: 700 }}>{cfg[key]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={cfg[key]}
        onChange={e => setCfg(c => ({ ...c, [key]: +e.target.value }))}
        style={{ width: '100%', accentColor: theme.accent }} />
    </div>
  );

  return (
    <div style={{ width: 264, background: '#07080c', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Settings2 size={14} style={{ color: theme.accent }} />
          <span style={{ color: '#eef2f7', fontWeight: 700, fontSize: 13 }}>Customize</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEmbed} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: theme.accentGlow, border: `1px solid ${theme.featuredBorder}`, borderRadius: 8, color: theme.accent, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
            <Download size={10} /> Embed
          </button>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#4a5568', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px 0' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 4px', borderRadius: '7px 7px 0 0', border: 'none', background: activeSection===s.id?'rgba(255,255,255,0.04)':'transparent', color: activeSection===s.id?theme.accent:'#4a5568', cursor: 'pointer', fontSize: 11, fontWeight: activeSection===s.id?700:400, fontFamily: 'DM Sans, sans-serif', borderBottom: activeSection===s.id?`2px solid ${theme.accent}`:'2px solid transparent', marginBottom: -1 }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {/* THEME section */}
        {activeSection === 'theme' && (
          <div>
            <label style={labelStyle}>Color Theme</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button key={key} onClick={() => setCfg(c => ({ ...c, themeKey: key }))} style={{ padding: '10px 8px', borderRadius: 10, border: `1px solid ${cfg.themeKey===key?preset.accent:preset.cardBorder}`, background: cfg.themeKey===key?preset.accentGlow:preset.cardBg, cursor: 'pointer', textAlign: 'center', transition: 'all 150ms' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: preset.cardBg, border: `2px solid ${preset.accent}`, margin: '0 auto 5px', boxShadow: `0 0 8px ${preset.accentGlow}` }} />
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: cfg.themeKey===key?preset.accent:preset.textSecondary }}>{preset.name}</p>
                </button>
              ))}
            </div>

            <div style={sectionGap}>
              <label style={labelStyle}>Font Family</label>
              <select value={cfg.fontFamily} onChange={e => setCfg(c => ({ ...c, fontFamily: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px 10px', color: '#eef2f7', fontSize: 12, outline: 'none', fontFamily: 'DM Sans, sans-serif', appearance: 'none', cursor: 'pointer' }}>
                {FONT_OPTIONS.map(f => <option key={f.value} value={f.value} style={{ background: '#0e1117' }}>{f.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* LAYOUT section */}
        {activeSection === 'layout' && (
          <div>
            <label style={labelStyle}>Display Type</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
              {LAYOUTS.map(l => (
                <button key={l.id} onClick={() => setLayout(l.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${layout===l.id?theme.featuredBorder:'rgba(255,255,255,0.07)'}`, background: layout===l.id?theme.accentGlow:'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms' }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: 'center', color: layout===l.id?theme.accent:'#4a5568' }}>{l.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: layout===l.id?theme.accent:'#eef2f7' }}>{l.label}</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#4a5568' }}>{l.desc}</p>
                  </div>
                  {layout===l.id && <Check size={12} style={{ color: theme.accent, marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>

            {layout === 'grid' && (
              <div style={sectionGap}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={labelStyle}>Columns</label>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  {[2,3,4].map(n => (
                    <button key={n} onClick={() => setCfg(c => ({ ...c, columns: n }))} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${cfg.columns===n?theme.featuredBorder:'rgba(255,255,255,0.07)'}`, background: cfg.columns===n?theme.accentGlow:'transparent', color: cfg.columns===n?theme.accent:'#4a5568', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>{n}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={sectionGap}>
              {[
                { key: 'featuredFirst', label: 'Feature First Card' },
                { key: 'showTitle', label: 'Show Page Title' },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ color: '#8896a8', fontSize: 12 }}>{label}</span>
                  <button onClick={() => setCfg(c => ({ ...c, [key]: !c[key] }))} style={{ width: 38, height: 21, borderRadius: 999, border: 'none', background: cfg[key]?theme.accent:'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'all 200ms', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: 2, left: 2, width: 17, height: 17, borderRadius: '50%', background: '#fff', transition: 'transform 200ms', transform: cfg[key]?'translateX(17px)':'translateX(0)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STYLE section */}
        {activeSection === 'style' && (
          <div>
            {sliderRow('borderRadius', 'Border Radius', 0, 28, 'px')}
            {sliderRow('fontSize', 'Text Size', 11, 18, 'px')}
            {sliderRow('maxItems', 'Max Items', 3, 30, '')}
            {sliderRow('truncateAt', 'Truncate Text At', 60, 400, ' ch')}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TestimonialWall() {
  const { spacename } = useParams();
  const navigate = useNavigate();

  const [testimonials, setTestimonials] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState('marquee');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [spaceInfo, setSpaceInfo] = useState(null);
  const [stats, setStats] = useState({ total: 0, avg: 0 });

  const [cfg, setCfg] = useState({
    themeKey: 'obsidian',
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: 14,
    fontSize: 13,
    maxItems: 20,
    truncateAt: 180,
    featuredFirst: true,
    showTitle: true,
    columns: 3,
  });

  const theme = THEME_PRESETS[cfg.themeKey] || THEME_PRESETS.obsidian;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${BACKEND_URL}/api/v1/fetchtestimonials`, { params: { spacename }, headers }).catch(() => ({ data: { testimonials: [] } })),
      axios.get(`${BACKEND_URL}/api/v1/spaceinfo`, { params: { spacename }, headers }).catch(() => ({ data: null })),
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
    if (filter === 'text')  list = list.filter(t => !t.videoUrl && !t.VideoURL);
    if (filter === 'liked') list = list.filter(t => t.liked);
    if (minRating > 0)      list = list.filter(t => (t.Rating || 0) >= minRating);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => [t.username, t.name, t.Content, t.text, t.email].join(' ').toLowerCase().includes(q));
    }
    setFiltered(list.slice(0, cfg.maxItems));
  }, [testimonials, filter, minRating, search, cfg.maxItems]);

  const renderLayout = () => {
    if (loading) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${theme.accentGlow}`, borderTopColor: theme.accent, animation: 'wol-spin 0.8s linear infinite' }} />
        <p style={{ color: theme.textMuted, fontSize: 13 }}>Loading testimonials…</p>
      </div>
    );
    if (!filtered.length) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 10 }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={22} style={{ color: theme.textMuted }} />
        </div>
        <p style={{ color: theme.textSecondary, fontWeight: 500, margin: 0 }}>No testimonials found</p>
        <p style={{ color: theme.textMuted, fontSize: 13, margin: 0 }}>Try adjusting filters</p>
      </div>
    );
    switch (layout) {
      case 'spotlight': return <SpotlightLayout items={filtered} theme={theme} cfg={cfg} />;
      case 'cascade':   return <CascadeLayout items={filtered} theme={theme} cfg={cfg} />;
      case 'grid':      return <GridLayout items={filtered} theme={theme} cfg={cfg} />;
      default:          return <MarqueeLayout items={filtered} theme={theme} cfg={cfg} />;
    }
  };

  const isLight = cfg.themeKey === 'noir';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&family=Space+Mono:wght@400;700&family=Lora:wght@400;600&family=Playfair+Display:wght@700&family=Raleway:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes wol-spin { to { transform: rotate(360deg); } }
        @keyframes wol-marquee     { from { transform: translateX(0);    } to { transform: translateX(-50%); } }
        @keyframes wol-marquee-rev { from { transform: translateX(-50%); } to { transform: translateX(0);    } }
        @keyframes wol-fadeup { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        input[type=range] { height: 4px; border-radius: 2px; }
        select option { background: #0e1117; }
      `}</style>

      <div style={{ minHeight: '100vh', background: theme.pageBg, color: theme.textPrimary, fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', transition: 'background 300ms' }}>

        {/* ── Top Bar ── */}
        <div style={{ borderBottom: `1px solid ${theme.cardBorder}`, background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(7,8,12,0.88)', backdropFilter: 'blur(14px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => navigate(`/space/${spacename}`)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'DM Sans, sans-serif' }}>
                <ArrowLeft size={13} /> Back
              </button>
              <div style={{ width: 1, height: 18, background: theme.cardBorder }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={12} fill={isLight?'#fff':'#000'} style={{ color: isLight?'#fff':'#000' }} />
                </div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: theme.textPrimary, fontSize: '0.9rem' }}>TestiQra</span>
              </div>
              {spaceInfo && (
                <>
                  <div style={{ width: 1, height: 18, background: theme.cardBorder }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {spaceInfo.logo && <img src={spaceInfo.logo} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', border: `1px solid ${theme.cardBorder}` }} />}
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: theme.textPrimary, fontSize: '0.85rem' }}>{spaceInfo.space_name || spacename}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {/* Mobile / Desktop toggle */}
              <button onClick={() => setIsMobilePreview(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, border: `1px solid ${isMobilePreview ? theme.featuredBorder : theme.cardBorder}`, background: isMobilePreview ? theme.accentGlow : 'transparent', color: isMobilePreview ? theme.accent : theme.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, transition: 'all 150ms' }}>
                {isMobilePreview ? <Smartphone size={12} /> : <Monitor size={12} />}
                {isMobilePreview ? 'Mobile' : 'Desktop'}
              </button>
              {/* Customize toggle */}
              <button onClick={() => setShowCustomizer(c => !c)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, border: `1px solid ${showCustomizer ? theme.featuredBorder : theme.cardBorder}`, background: showCustomizer ? theme.accentGlow : 'transparent', color: showCustomizer ? theme.accent : theme.textSecondary, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, transition: 'all 150ms' }}>
                <Settings2 size={12} /> Customize
              </button>
              {/* Embed */}
              <button onClick={() => setShowEmbed(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, border: `1px solid ${theme.cardBorder}`, background: 'transparent', color: theme.textSecondary, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, transition: 'all 150ms' }}>
                <Share2 size={12} /> Embed
              </button>
            </div>
          </div>
        </div>

        {/* ── Main area (wall + optional sidebar) ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Wall content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', transition: 'all 300ms' }}>

            {/* Hero */}
            {cfg.showTitle && (
              <div style={{ textAlign: 'center', padding: '2.25rem 1.5rem 1.5rem', background: `radial-gradient(ellipse 55% 50% at 50% 0%, ${theme.accentGlow} 0%, transparent 70%)`, animation: 'wol-fadeup 0.5s ease both' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: theme.accent, marginBottom: 10 }}>Wall of Love</p>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)', color: theme.textPrimary, marginBottom: 6 }}>
                  {spaceInfo?.space_name || spacename}
                </h1>
                <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 18 }}>Real words from real customers</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 999, padding: '6px 18px', fontSize: 12 }}>
                  <span style={{ color: theme.textSecondary }}>
                    <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{stats.total}</span> reviews
                  </span>
                  <span style={{ color: theme.cardBorder }}>·</span>
                  <span style={{ color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Star size={10} fill={theme.starColor} style={{ color: theme.starColor }} />
                    <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{stats.avg}</span> avg
                  </span>
                </div>
              </div>
            )}

            {/* Controls bar */}
            <div style={{ borderBottom: `1px solid ${theme.cardBorder}`, background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(7,8,12,0.4)', backdropFilter: 'blur(8px)', padding: '0.7rem 1.5rem', position: 'sticky', top: 53, zIndex: 40 }}>
              <div style={{ maxWidth: 1380, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Layout picker compact */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {LAYOUTS.map(l => (
                    <button key={l.id} onClick={() => setLayout(l.id)} title={l.label} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${layout===l.id?theme.featuredBorder:theme.cardBorder}`, background: layout===l.id?theme.accentGlow:'transparent', color: layout===l.id?theme.accent:theme.textMuted, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms', fontWeight: 700 }}>
                      {l.icon}
                    </button>
                  ))}
                </div>

                <div style={{ width: 1, height: 18, background: theme.cardBorder }} />

                {/* Filter pills */}
                <div style={{ display: 'flex', gap: 5 }}>
                  {[['all','All'],['text','Text'],['video','Video'],['liked','❤️ Loved']].map(([f, label]) => (
                    <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: filter===f?700:500, border: `1px solid ${filter===f?theme.featuredBorder:theme.cardBorder}`, background: filter===f?theme.accentGlow:'transparent', color: filter===f?theme.accent:theme.textMuted, cursor: 'pointer', transition: 'all 150ms', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Min rating */}
                  <select value={minRating} onChange={e => setMinRating(+e.target.value)} style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 8, color: theme.textSecondary, fontSize: 11, padding: '5px 8px', outline: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    {[0,1,2,3,4,5].map(r => <option key={r} value={r}>{r === 0 ? 'Any ★' : `${r}+ ★`}</option>)}
                  </select>
                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <Search size={11} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 9, color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', fontSize: 11, padding: '6px 10px 6px 28px', outline: 'none', width: 150, transition: 'border-color 150ms' }} />
                    {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', display: 'flex' }}><X size={11} /></button>}
                  </div>
                </div>
              </div>
            </div>

            {/* Wall content */}
            <div style={{ maxWidth: isMobilePreview ? 400 : 1380, margin: '0 auto', width: '100%', padding: '1.5rem 1.5rem 4rem', transition: 'max-width 400ms cubic-bezier(0.4,0,0.2,1)' }}>
              {renderLayout()}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', padding: '1rem', color: theme.textMuted, fontSize: 11, borderTop: `1px solid ${theme.cardBorder}`, marginTop: 'auto' }}>
              Powered by <span style={{ color: theme.accent, fontWeight: 700 }}>TestiQra</span>
            </div>
          </div>

          {/* ── Customizer Sidebar ── */}
          {showCustomizer && (
            <CustomizerPanel
              cfg={cfg}
              setCfg={setCfg}
              layout={layout}
              setLayout={setLayout}
              onEmbed={() => { setShowEmbed(true); }}
              onClose={() => setShowCustomizer(false)}
              theme={theme}
            />
          )}
        </div>
      </div>

      {showEmbed && <EmbedModal spacename={spacename} layout={layout} cfg={cfg} onClose={() => setShowEmbed(false)} />}
    </>
  );
}