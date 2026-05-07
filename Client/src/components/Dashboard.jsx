import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus, X, Settings, LogOut, Search, ChevronRight,
  Star, MessageSquare, Heart, Sparkles, FileText,
  Trash2, Edit3, AlertTriangle, LayoutGrid, TrendingUp,
  Video, ExternalLink
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

import { BACKEND_URL } from '../utils/DB';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [showPopup, setShowPopup] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchSpaces = async () => {
      setLoading(true);
      try {
        const r = await axios.get(`${BACKEND_URL}/api/v1/space-fetch`, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        });
        setSpaces(r.data.spaces.spaces || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchSpaces();
  }, []);

  const filtered = spaces.filter(s =>
    s.space_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteSpace = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/v1/space/${deleteModal.space_name}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setSpaces(prev => prev.filter(s => s.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (e) {
      setSpaces(prev => prev.filter(s => s.id !== deleteModal.id));
      setDeleteModal(null);
    } finally { setDeleting(false); }
  };

  const totalTestimonials = spaces.reduce((sum, s) => sum + (s.testimonials?.length || 0), 0);
  const totalLiked = spaces.reduce((sum, s) => sum + (s.testimonials?.filter(t => t.liked)?.length || 0), 0);

  return (
    <div className="min-h-screen w-full page-wrapper" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Sticky Header ── */}
      <header className="app-header sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-[var(--shadow-violet)]"
              style={{ background: 'var(--violet)' }}>
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>TestiQra</span>
          </div>

          {/* Search + actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                width: 220
              }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search spaces…"
                className="bg-transparent focus:outline-none flex-1 text-sm"
                style={{ color: 'var(--text-primary)' }}
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={12} style={{ color: 'var(--text-muted)' }} />
                </button>
              )}
            </div>

            <ThemeToggle size="md" />

            <button
              onClick={() => { localStorage.removeItem('token'); navigate('/signin'); }}
              className="btn-ghost p-2 rounded-xl"
              title="Sign out"
            >
              <LogOut size={15} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* ── Page Title + CTA ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl mb-0.5" style={{ color: 'var(--text-primary)' }}>
              Your Spaces
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {filtered.length} of {spaces.length} spaces
            </p>
          </div>
          <button
            onClick={() => setShowPopup(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Plus size={15} /> Create Space
          </button>
        </div>

        {/* ── Mobile Search ── */}
        <div className="sm:hidden flex items-center gap-2 rounded-xl px-3 py-2.5 mb-5"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search spaces…"
            className="bg-transparent focus:outline-none flex-1 text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* ── Empty State ── */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 animate-fadeUp">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <MessageSquare size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {search ? 'No spaces match your search' : 'No spaces yet'}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {search ? 'Try a different search term' : 'Create your first space to start collecting testimonials'}
            </p>
            {!search && (
              <button onClick={() => setShowPopup(true)} className="btn-primary px-6 py-3 text-sm">
                Create your first space
              </button>
            )}
          </div>
        )}

        {/* ── Loading Skeletons ── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="skeleton w-14 h-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 rounded w-3/4" />
                    <div className="skeleton h-3 rounded w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3].map(j => <div key={j} className="skeleton h-10 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Spaces Grid ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {filtered.map(space => (
              <SpaceCard
                key={space.id}
                space={space}
                onClick={() => navigate(`/space/${space.space_name}`)}
                onEdit={() => navigate(`/edit/${space.space_name}`)}
                onDelete={() => setDeleteModal(space)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create Space Modal ── */}
      {showPopup && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="modal-content w-full max-w-sm animate-fadeUp">
            <div className="flex items-center justify-between p-5"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Create a new Space</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Choose how you'd like to set it up</p>
              </div>
              <button onClick={() => setShowPopup(false)} className="btn-ghost p-1.5 rounded-lg">
                <X size={15} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* From Scratch */}
              <button
                onClick={() => { navigate('/space-creation'); setShowPopup(false); }}
                className="w-full flex items-center justify-between p-4 rounded-xl text-left transition-all group"
                style={{
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-border)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-subtle)'}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--accent)', color: '#000' }}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>From scratch</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Full customisation</p>
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* AI Mode */}
              <button
                onClick={() => { navigate('/space-creation?mode=ai'); setShowPopup(false); }}
                className="w-full flex items-center justify-between p-4 rounded-xl text-left transition-all group"
                style={{
                  background: 'var(--violet-subtle)',
                  border: '1px solid var(--violet-border)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--violet-subtle)'}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--violet)', color: '#fff' }}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Create with AI</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI generates your content</p>
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="modal-content w-full max-w-sm animate-fadeUp">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--danger-subtle)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
              </div>
              <h2 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Delete Space</h2>
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete
              </p>
              <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                "{deleteModal.space_name}"?
              </p>
              <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                This will permanently delete all testimonials. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                  className="flex-1 btn-ghost py-2.5 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSpace}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
                  style={{ background: 'var(--danger)' }}
                >
                  {deleting
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Trash2 size={14} /> Delete</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Space Card Component ── */
function SpaceCard({ space, onClick, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
      }
    };
    if (showActions) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  return (
    <div
      onClick={onClick}
      className="card p-5 cursor-pointer group animate-fadeUp"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
            style={{ border: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
            <img
              src={space.logo || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'}
              alt={space.space_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
              {space.space_name}
            </h3>
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
              {space.header || 'No header set'}
            </p>
          </div>
        </div>

        {/* Settings Dropdown */}
        <div ref={actionsRef} className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowActions(v => !v)}
            className={`btn-ghost p-1.5 rounded-lg transition-all ${showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <Settings size={13} style={{ color: 'var(--text-secondary)' }} />
          </button>

          {showActions && (
            <div className="dropdown absolute right-0 top-full mt-1.5 w-44 overflow-hidden z-20">
              <button
                onClick={() => { setShowActions(false); onEdit(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Edit3 size={13} style={{ color: 'var(--accent)' }} /> Edit Space
              </button>
              <button
                onClick={() => { setShowActions(false); onDelete(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--danger-subtle)';
                  e.currentTarget.style.color = 'var(--danger)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Trash2 size={13} style={{ color: 'var(--danger)' }} /> Delete Space
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats chips */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: <MessageSquare size={12} />, label: 'Reviews', color: 'var(--accent)' },
          { icon: <Heart size={12} />,         label: 'Loved',   color: '#f43f5e' },
          { icon: <Star size={12} />,          label: 'Rating',  color: '#f59e0b' },
        ].map(s => (
          <div key={s.label}
            className="flex flex-col items-center py-2.5 rounded-xl text-xs font-medium"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: s.color
            }}
          >
            {s.icon}
            <span className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          testiqra.io/{space.space_name}
        </span>
        <ChevronRight size={13} style={{ color: 'var(--text-muted)' }}
          className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}