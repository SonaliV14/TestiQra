import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/* ─── Star Rating ─────────────────────────────────────────── */
const Stars = ({ rating = 5, size = 14 }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 14 14" fill={i <= rating ? '#fbbf24' : '#334155'}>
        <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.3l-3.7 2L4 8.2 1 5.3l4.2-.7z"/>
      </svg>
    ))}
  </span>
);

/* ─── Avatar ──────────────────────────────────────────────── */
const Avatar = ({ name = '', photo, size = 44 }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#7c3aed','#db2777','#0891b2','#059669','#d97706','#dc2626'];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (photo) return (
    <img src={photo} alt={name} width={size} height={size}
      style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(139,92,246,0.3)' }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, color: '#fff', flexShrink: 0,
      border: '2px solid rgba(139,92,246,0.3)',
    }}>{initials || '?'}</div>
  );
};

/* ─── Video Player Card ────────────────────────────────────── */
const VideoCard = ({ t, layout }) => {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else         { videoRef.current.play();  setPlaying(true);  }
  };

  return (
    <div className={`testimonial-card video-card layout-${layout}`}>
      <div className="video-wrapper" onClick={toggle}>
        <video ref={videoRef} src={t.videoUrl} style={{ width:'100%', borderRadius: 10, display:'block' }}
          onEnded={() => setPlaying(false)} />
        {!playing && (
          <div className="play-overlay">
            <div className="play-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 4l11 6-11 6V4z"/>
              </svg>
            </div>
          </div>
        )}
        <span className="video-badge">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M1 2l6 3-6 3V2z"/>
          </svg>
          Video
        </span>
      </div>
      <div className="card-body">
        {t.rating && <Stars rating={t.rating} />}
        {t.text && <p className="testimonial-text">{t.text}</p>}
        <div className="author-row">
          <Avatar name={t.name} photo={t.photo} size={36} />
          <div>
            <p className="author-name">{t.name}</p>
            {t.role && <p className="author-meta">{t.role}{t.company ? ` · ${t.company}` : ''}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Text Card ───────────────────────────────────────────── */
const TextCard = ({ t, layout, featured }) => (
  <div className={`testimonial-card layout-${layout} ${featured ? 'featured' : ''}`}>
    <div className="card-body">
      <div className="card-top">
        {t.rating && <Stars rating={t.rating} />}
        {featured && <span className="featured-badge">✦ Featured</span>}
      </div>
      <blockquote className="testimonial-text">"{t.text}"</blockquote>
      <div className="author-row">
        <Avatar name={t.name} photo={t.photo} size={36} />
        <div>
          <p className="author-name">{t.name}</p>
          {t.role && <p className="author-meta">{t.role}{t.company ? ` · ${t.company}` : ''}</p>}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Testimonial Card Router ─────────────────────────────── */
const TestimonialCard = ({ t, layout, index }) => {
  if (t.videoUrl) return <VideoCard t={t} layout={layout} />;
  return <TextCard t={t} layout={layout} featured={index === 0} />;
};

/* ─── Layout Components ───────────────────────────────────── */
const MasonryLayout = ({ testimonials }) => {
  const cols = [[], [], []];
  testimonials.forEach((t, i) => cols[i % 3].push({ t, i }));
  return (
    <div className="masonry-grid">
      {cols.map((col, ci) => (
        <div key={ci} className="masonry-col">
          {col.map(({ t, i }) => <TestimonialCard key={t.id || i} t={t} layout="masonry" index={i} />)}
        </div>
      ))}
    </div>
  );
};

const GridLayout = ({ testimonials }) => (
  <div className="grid-layout">
    {testimonials.map((t, i) => <TestimonialCard key={t.id || i} t={t} layout="grid" index={i} />)}
  </div>
);

const ListLayout = ({ testimonials }) => (
  <div className="list-layout">
    {testimonials.map((t, i) => <TestimonialCard key={t.id || i} t={t} layout="list" index={i} />)}
  </div>
);

const CarouselLayout = ({ testimonials }) => {
  const [idx, setIdx] = useState(0);
  const visible = 3;
  const max = Math.max(0, testimonials.length - visible);
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(max, i + 1));

  return (
    <div className="carousel-wrapper">
      <button className="carousel-arrow left" onClick={prev} disabled={idx === 0}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4L6 9l5 5"/></svg>
      </button>
      <div className="carousel-track-outer">
        <div className="carousel-track" style={{ transform: `translateX(calc(-${idx} * (340px + 16px)))` }}>
          {testimonials.map((t, i) => (
            <div key={t.id || i} className="carousel-item">
              <TestimonialCard t={t} layout="carousel" index={i} />
            </div>
          ))}
        </div>
      </div>
      <button className="carousel-arrow right" onClick={next} disabled={idx >= max}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 4l5 5-5 5"/></svg>
      </button>
      <div className="carousel-dots">
        {Array.from({ length: max + 1 }).map((_, i) => (
          <button key={i} className={`dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} />
        ))}
      </div>
    </div>
  );
};

const FeaturedLayout = ({ testimonials }) => {
  const [hero, ...rest] = testimonials;
  return (
    <div className="featured-layout">
      {hero && (
        <div className="hero-testimonial">
          <TestimonialCard t={hero} layout="hero" index={0} />
        </div>
      )}
      <div className="featured-grid">
        {rest.map((t, i) => <TestimonialCard key={t.id || i} t={t} layout="grid" index={i+1} />)}
      </div>
    </div>
  );
};

/* ─── Embed Panel ─────────────────────────────────────────── */
const EmbedPanel = ({ spacename, layout, onClose }) => {
  const [copied, setCopied] = useState('');
  const iframeCode = `<iframe src="${window.location.origin}/walloflove/${layout}/${spacename}" width="100%" height="600" frameborder="0" style="border-radius:16px;"></iframe>`;
  const scriptCode = `<div id="testiqra-wall" data-space="${spacename}" data-layout="${layout}"></div>\n<script src="${window.location.origin}/embed.js"><\/script>`;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="embed-overlay" onClick={onClose}>
      <div className="embed-panel" onClick={e => e.stopPropagation()}>
        <div className="embed-header">
          <h3>Embed Your Wall</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l12 12M14 2L2 14"/></svg>
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Copy the code below and paste it into your website.
        </p>
        <div className="embed-section">
          <label className="form-label">iFrame Embed</label>
          <div className="code-block">
            <code>{iframeCode}</code>
            <button className="copy-btn" onClick={() => copy(iframeCode, 'iframe')}>
              {copied === 'iframe' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="embed-section">
          <label className="form-label">Script Embed</label>
          <div className="code-block">
            <code>{scriptCode}</code>
            <button className="copy-btn" onClick={() => copy(scriptCode, 'script')}>
              {copied === 'script' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main WallOfLove Component ───────────────────────────── */
export default function WallOfLove() {
  const { spacename } = useParams();
  const navigate = useNavigate();

  const [testimonials, setTestimonials] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState('masonry');
  const [filter, setFilter] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [search, setSearch] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);
  const [spaceInfo, setSpaceInfo] = useState(null);

  /* Fetch testimonials */
  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(`/api/v1/fetchtestimonials/${spacename}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).then(r => r.json()).catch(() => ({ testimonials: [] })),
      fetch(`/api/v1/spaceinfo/${spacename}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).then(r => r.json()).catch(() => null),
    ]).then(([tData, sData]) => {
      const items = tData?.testimonials || tData?.data || [];
      setTestimonials(items);
      setFiltered(items);
      setSpaceInfo(sData?.space || sData || null);
      setLoading(false);
    });
  }, [spacename]);

  /* Apply filters */
  useEffect(() => {
    let result = [...testimonials];
    if (filter === 'video') result = result.filter(t => t.videoUrl);
    if (filter === 'text')  result = result.filter(t => !t.videoUrl && t.text);
    if (minRating > 0)      result = result.filter(t => (t.rating || 0) >= minRating);
    if (search.trim())      result = result.filter(t =>
      [t.name, t.text, t.company, t.role].join(' ').toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [testimonials, filter, minRating, search]);

  const LAYOUTS = [
    { id: 'masonry', label: 'Masonry', icon: '⊞' },
    { id: 'grid',    label: 'Grid',    icon: '⊟' },
    { id: 'list',    label: 'List',    icon: '≡' },
    { id: 'carousel',label: 'Carousel',icon: '◁▷' },
    { id: 'featured',label: 'Featured',icon: '★' },
  ];

  const renderLayout = () => {
    if (loading) return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading testimonials…</p>
      </div>
    );
    if (!filtered.length) return (
      <div className="empty-state">
        <div className="empty-icon">◎</div>
        <h3>No testimonials found</h3>
        <p>Try adjusting your filters</p>
      </div>
    );
    switch (layout) {
      case 'grid':     return <GridLayout testimonials={filtered} />;
      case 'list':     return <ListLayout testimonials={filtered} />;
      case 'carousel': return <CarouselLayout testimonials={filtered} />;
      case 'featured': return <FeaturedLayout testimonials={filtered} />;
      default:         return <MasonryLayout testimonials={filtered} />;
    }
  };

  return (
    <>
      <style>{`
        .wall-page {
          min-height: 100vh;
          background: #020617;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        /* ── Top bar ── */
        .wall-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          border-bottom: 1px solid rgba(139,92,246,0.12);
          background: rgba(13,21,38,0.9);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .wall-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 1.1rem;
          color: #f1f5f9;
        }
        .wall-brand-dot {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: linear-gradient(135deg,#7c3aed,#a855f7,#f59e0b);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: #fff;
        }
        .wall-topbar-actions { display: flex; gap: 8px; align-items: center; }

        /* ── Hero ── */
        .wall-hero {
          text-align: center;
          padding: 4rem 2rem 2rem;
          background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.18) 0%, transparent 70%);
        }
        .wall-hero h1 {
          font-size: clamp(1.75rem, 4vw, 3rem);
          font-family: 'Instrument Serif', Georgia, serif;
          color: #f1f5f9;
          margin-bottom: 0.5rem;
        }
        .wall-hero p { color: #94a3b8; font-size: 1rem; margin-bottom: 1.5rem; }
        .wall-stat {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 0.875rem;
          color: #c4b5fd;
        }

        /* ── Controls ── */
        .wall-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          padding: 1.25rem 2rem;
          border-bottom: 1px solid rgba(139,92,246,0.1);
          background: rgba(13,21,38,0.5);
        }
        .layout-switcher {
          display: flex;
          gap: 4px;
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 10px;
          padding: 4px;
        }
        .layout-btn {
          padding: 6px 12px;
          border-radius: 7px;
          font-size: 0.8rem;
          font-weight: 500;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          transition: all 200ms;
          display: flex; align-items: center; gap: 5px;
        }
        .layout-btn.active {
          background: rgba(139,92,246,0.2);
          color: #c4b5fd;
          border: 1px solid rgba(139,92,246,0.3);
        }
        .wall-search {
          flex: 1;
          min-width: 200px;
          max-width: 320px;
          background: rgba(10,19,34,0.9);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 9px;
          color: #f1f5f9;
          font-family: inherit;
          font-size: 0.875rem;
          padding: 8px 14px;
          outline: none;
          transition: border-color 150ms;
        }
        .wall-search:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
        .wall-search::placeholder { color: #475569; }
        .filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
        .filter-btn {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 500;
          border: 1px solid rgba(139,92,246,0.2);
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 150ms;
        }
        .filter-btn.active {
          background: rgba(139,92,246,0.15);
          color: #c4b5fd;
          border-color: rgba(139,92,246,0.4);
        }
        .rating-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #64748b;
        }
        .rating-filter select {
          background: rgba(10,19,34,0.9);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 7px;
          color: #94a3b8;
          font-size: 0.8rem;
          padding: 6px 10px;
          outline: none;
          cursor: pointer;
        }
        .controls-right { margin-left: auto; display: flex; gap: 8px; }
        .embed-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.825rem;
          font-weight: 500;
          border: 1px solid rgba(139,92,246,0.3);
          background: rgba(139,92,246,0.08);
          color: #c4b5fd;
          cursor: pointer;
          transition: all 150ms;
        }
        .embed-btn:hover { background: rgba(139,92,246,0.18); }

        /* ── Content area ── */
        .wall-content { padding: 2rem; max-width: 1400px; margin: 0 auto; }

        /* ── Masonry ── */
        .masonry-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 900px) { .masonry-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .masonry-grid { grid-template-columns: 1fr; } }
        .masonry-col { display: flex; flex-direction: column; gap: 16px; }

        /* ── Grid ── */
        .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

        /* ── List ── */
        .list-layout { display: flex; flex-direction: column; gap: 12px; max-width: 800px; margin: 0 auto; }

        /* ── Carousel ── */
        .carousel-wrapper { position: relative; overflow: hidden; }
        .carousel-track-outer { overflow: hidden; }
        .carousel-track { display: flex; gap: 16px; transition: transform 400ms cubic-bezier(0.4,0,0.2,1); }
        .carousel-item { min-width: 340px; flex-shrink: 0; }
        .carousel-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          z-index: 10;
          width: 40px; height: 40px;
          border-radius: 50%;
          background: rgba(13,21,38,0.9);
          border: 1px solid rgba(139,92,246,0.3);
          color: #c4b5fd;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 150ms;
        }
        .carousel-arrow:hover { background: rgba(139,92,246,0.2); }
        .carousel-arrow:disabled { opacity: 0.3; cursor: default; }
        .carousel-arrow.left { left: -16px; }
        .carousel-arrow.right { right: -16px; }
        .carousel-dots { display: flex; justify-content: center; gap: 6px; margin-top: 1.5rem; }
        .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #334155; border: none; cursor: pointer; transition: all 200ms;
        }
        .dot.active { background: #8b5cf6; width: 20px; border-radius: 3px; }

        /* ── Featured ── */
        .featured-layout { display: flex; flex-direction: column; gap: 16px; }
        .hero-testimonial .testimonial-card { padding: 2rem; }
        .hero-testimonial .testimonial-text { font-size: 1.2rem; }
        .featured-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

        /* ── Cards ── */
        .testimonial-card {
          background: linear-gradient(145deg, #152040 0%, #0f172a 100%);
          border: 1px solid rgba(139,92,246,0.12);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 250ms, transform 250ms, box-shadow 250ms;
          animation: fadeUp 0.4s ease both;
        }
        .testimonial-card:hover {
          border-color: rgba(139,92,246,0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.15);
        }
        .testimonial-card.featured {
          border-color: rgba(251,191,36,0.25);
          background: linear-gradient(145deg, #1a2040 0%, #0f172a 100%);
        }
        .testimonial-card.featured:hover { border-color: rgba(251,191,36,0.4); box-shadow: 0 0 32px rgba(251,191,36,0.1); }

        .card-body { padding: 1.25rem; }
        .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .testimonial-text {
          color: #cbd5e1;
          font-size: 0.9rem;
          line-height: 1.7;
          margin: 10px 0;
          quotes: none;
        }
        .layout-hero .testimonial-text { font-size: 1.15rem; color: #e2e8f0; }
        .author-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(139,92,246,0.1); }
        .author-name { font-size: 0.875rem; font-weight: 600; color: #f1f5f9; }
        .author-meta { font-size: 0.775rem; color: #64748b; margin-top: 1px; }

        .featured-badge {
          font-size: 0.7rem; font-weight: 600;
          color: #fbbf24;
          background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.2);
          border-radius: 999px;
          padding: 2px 8px;
        }

        /* ── Video card ── */
        .video-wrapper { position: relative; cursor: pointer; }
        .play-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.35);
          border-radius: 10px 10px 0 0;
          transition: background 150ms;
        }
        .video-wrapper:hover .play-overlay { background: rgba(0,0,0,0.5); }
        .play-btn {
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(139,92,246,0.85);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 0 20px rgba(139,92,246,0.5);
          transition: transform 150ms;
        }
        .video-wrapper:hover .play-btn { transform: scale(1.1); }
        .video-badge {
          position: absolute; top: 10px; left: 10px;
          background: rgba(13,21,38,0.85);
          border: 1px solid rgba(139,92,246,0.3);
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 0.7rem;
          color: #c4b5fd;
          font-weight: 600;
          display: flex; align-items: center; gap: 4px;
          backdrop-filter: blur(8px);
        }

        /* ── States ── */
        .loading-state, .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 300px; gap: 12px; color: #64748b;
        }
        .spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(139,92,246,0.2);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .empty-icon { font-size: 3rem; color: #334155; }
        .empty-state h3 { color: #475569; font-size: 1rem; }

        /* ── Embed Panel ── */
        .embed-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(6px);
          z-index: 100;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .embed-panel {
          background: #0d1526;
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 16px;
          padding: 1.75rem;
          max-width: 560px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7);
        }
        .embed-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .embed-header h3 { font-size: 1.1rem; font-weight: 600; color: #f1f5f9; }
        .embed-section { margin-bottom: 1.25rem; }
        .code-block {
          background: #020617;
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 8px;
          padding: 12px;
          margin-top: 6px;
          position: relative;
          overflow: hidden;
        }
        .code-block code { font-family: 'Courier New', monospace; font-size: 0.775rem; color: #94a3b8; word-break: break-all; display: block; }
        .copy-btn {
          margin-top: 8px;
          font-size: 0.775rem;
          font-weight: 600;
          color: #a78bfa;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.25);
          border-radius: 6px;
          padding: 4px 12px;
          cursor: pointer;
          transition: all 150ms;
        }
        .copy-btn:hover { background: rgba(139,92,246,0.2); }

        /* ── Btn overrides ── */
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-family: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: all 200ms; }
        .btn-ghost { background: transparent; color: #94a3b8; border: 1px solid transparent; }
        .btn-ghost:hover { background: rgba(139,92,246,0.1); color: #f1f5f9; border-color: rgba(139,92,246,0.2); }
        .btn-icon { width: 34px; height: 34px; padding: 0; }
        .btn-primary { background: linear-gradient(135deg,#7c3aed,#a855f7,#f59e0b); color: #fff; box-shadow: 0 0 20px rgba(139,92,246,0.4); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 32px rgba(139,92,246,0.6); }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="wall-page">
        {/* ── Top Bar ── */}
        <div className="wall-topbar">
          <div className="wall-brand">
            <div className="wall-brand-dot">T</div>
            TestiQra
          </div>
          <div className="wall-topbar-actions">
            <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
              {spaceInfo?.name || spacename}
            </span>
            <button className="btn btn-primary" onClick={() => navigate(`/testimonial.to/${spacename}`)}>
              + Submit Testimonial
            </button>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="wall-hero">
          <p className="section-eyebrow" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', marginBottom: '0.75rem' }}>
            Wall of Love
          </p>
          <h1>{spaceInfo?.name || spacename}</h1>
          <p>{spaceInfo?.description || 'Real words from real customers'}</p>
          <span className="wall-stat">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="#fbbf24"><path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.3l-3.7 2L4 8.2 1 5.3l4.2-.7z"/></svg>
            {testimonials.length} testimonials
          </span>
        </div>

        {/* ── Controls ── */}
        <div className="wall-controls">
          {/* Layout switcher */}
          <div className="layout-switcher">
            {LAYOUTS.map(l => (
              <button key={l.id} className={`layout-btn ${layout === l.id ? 'active' : ''}`} onClick={() => setLayout(l.id)}>
                <span style={{ fontSize: 11 }}>{l.icon}</span>
                {l.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <input className="wall-search" placeholder="Search testimonials…" value={search} onChange={e => setSearch(e.target.value)} />

          {/* Filters */}
          <div className="filter-group">
            {['all','text','video'].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'text' ? '✍ Text' : '▶ Video'}
              </button>
            ))}
          </div>

          {/* Rating */}
          <div className="rating-filter">
            <span>Min ★</span>
            <select value={minRating} onChange={e => setMinRating(+e.target.value)}>
              {[0,1,2,3,4,5].map(r => <option key={r} value={r}>{r === 0 ? 'Any' : `${r}+`}</option>)}
            </select>
          </div>

          {/* Right actions */}
          <div className="controls-right">
            <button className="embed-btn" onClick={() => setShowEmbed(true)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 2h3v3M13 1L8 6M5 12H2V9M1 13l5-5"/>
              </svg>
              Embed
            </button>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="wall-content">
          {renderLayout()}
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', padding: '2rem', color: '#334155', fontSize: '0.8rem', borderTop: '1px solid rgba(139,92,246,0.08)' }}>
          Powered by <span style={{ color: '#a78bfa', fontWeight: 600 }}>TestiQra</span>
        </div>

        {/* ── Embed Panel ── */}
        {showEmbed && <EmbedPanel spacename={spacename} layout={layout} onClose={() => setShowEmbed(false)} />}
      </div>
    </>
  );
}